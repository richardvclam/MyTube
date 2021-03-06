import urllib from 'url';
import querystring from 'querystring';
import sax from 'sax';
import axios from 'axios';
import {
  between,
  stripHTML,
  addFormatMeta,
  sortFormats,
  getVideoID
} from './util';
import * as extras from './info-extras';
import * as sig from './sig';
import FORMATS from './formats';

const VIDEO_URL = 'https://www.youtube.com/watch?v=';
const EMBED_URL = 'https://www.youtube.com/embed/';
const VIDEO_EURL = 'https://youtube.googleapis.com/v/';
const INFO_HOST = 'www.youtube.com';
const INFO_PATH = '/get_video_info';
const KEYS_TO_SPLIT = ['fmt_list', 'fexp', 'watermark'];

/**
 * Gets info from a video without getting additional formats.
 *
 * @param {string} id
 * @param {Object} options
 * @param {Function(Error, Object)} callback
 */
export const getBasicInfo = (id: string, options, callback) => {
  // Try getting config from the video page first.
  const params = 'hl=' + (options.lang || 'en');
  let url =
    VIDEO_URL + id + '&' + params + '&bpctr=' + Math.ceil(Date.now() / 1000);
  console.log('url', url);

  // Remove header from watch page request.
  // Otherwise, it'll use a different framework for rendering content.
  const reqOptions = Object.assign({}, options.requestOptions);
  reqOptions.headers = Object.assign({}, reqOptions.headers, {
    'User-Agent': ''
  });

  axios
    .get(url, reqOptions)
    .then(res => {
      const body = res.data;

      // Check if there are any errors with this video page.
      const unavailableMsg = between(body, '<div id="player-unavailable"', '>');
      if (
        unavailableMsg &&
        !/\bhid\b/.test(between(unavailableMsg, 'class="', '"'))
      ) {
        // Ignore error about age restriction.
        if (!body.includes('<div id="watch7-player-age-gate-content"')) {
          return callback(
            Error(
              between(
                body,
                '<h1 id="unavailable-message" class="message">',
                '</h1>'
              ).trim()
            )
          );
        }
      }
      // Parse out additional metadata from this page.
      const additional = {
        // Get the author/uploader.
        author: extras.getAuthor(body),

        // Get the day the vid was published.
        published: extras.getPublished(body),

        // Get description.
        description: extras.getVideoDescription(body),

        // Get media info.
        media: extras.getVideoMedia(body),

        // Get related videos.
        related_videos: extras.getRelatedVideos(body)
      };

      const jsonStr = between(body, 'ytplayer.config = ', '</script>');
      let config;
      if (jsonStr) {
        config = jsonStr.slice(0, jsonStr.lastIndexOf(';ytplayer.load'));
        gotConfig(id, options, additional, config, false, callback);
      } else {
        // If the video page doesn't work, maybe because it has mature content.
        // and requires an account logged in to view, try the embed page.
        url = EMBED_URL + id + '?' + params;

        axios(url, options.requestOptions)
          .then(res => {
            config = between(
              body,
              "t.setConfig({'PLAYER_CONFIG': ",
              /\}(,'|\}\);)/
            );
            gotConfig(id, options, additional, config, true, callback);
          })
          .catch(callback);
      }
    })
    .catch(callback);
};

/**
 * @param {Object} info
 * @return {Array.<Object>}
 */
const parseFormats = info => {
  let formats = [];
  if (info.url_encoded_fmt_stream_map) {
    formats = formats.concat(info.url_encoded_fmt_stream_map.split(','));
  }
  if (info.adaptive_fmts) {
    formats = formats.concat(info.adaptive_fmts.split(','));
  }
  formats = formats.map(format => querystring.parse(format));
  delete info.url_encoded_fmt_stream_map;
  delete info.adaptive_fmts;
  return formats;
};

/**
 * @param {Object} id
 * @param {Object} options
 * @param {Object} additional
 * @param {Object} config
 * @param {boolean} fromEmbed
 * @param {Function(Error, Object)} callback
 */
const gotConfig = (id, options, additional, config, fromEmbed, callback) => {
  if (!config) {
    return callback(Error('Could not find player config'));
  }
  try {
    config = JSON.parse(config + (fromEmbed ? '}' : ''));
  } catch (err) {
    return callback(Error('Error parsing config: ' + err.message));
  }
  const url = urllib.format({
    protocol: 'https',
    host: INFO_HOST,
    pathname: INFO_PATH,
    query: {
      video_id: id,
      eurl: VIDEO_EURL + id,
      ps: 'default',
      gl: 'US',
      hl: options.lang || 'en',
      sts: config.sts
    }
  });

  axios(url, options.requestOptions)
    .then(res => {
      const body = res.data;

      let info = querystring.parse(body);

      if (
        !info.url_encoded_fmt_stream_map &&
        !info.adaptive_fmts &&
        !info.config &&
        (config.args.fmt_list ||
          config.args.url_encoded_fmt_stream_map ||
          config.args.adaptive_fmts)
      ) {
        info = config.args;
        info.no_embed_allowed = true;
      } else if (info.status === 'fail') {
        return callback(
          Error(`Code ${info.errorcode}: ${stripHTML(info.reason)}`)
        );
      }

      const player_response =
        config.args.player_response || info.player_response;
      try {
        info.player_response = JSON.parse(player_response);
      } catch (err) {
        return callback(
          Error('Error parsing `player_response`: ' + err.message)
        );
      }
      let playability = info.player_response.playabilityStatus;
      if (playability && playability.status === 'UNPLAYABLE') {
        return callback(Error(playability.reason));
      }

      // Split some keys by commas.
      KEYS_TO_SPLIT.forEach(key => {
        if (!info[key]) return;
        info[key] = info[key].split(',').filter(v => v !== '');
      });

      info.fmt_list = info.fmt_list
        ? info.fmt_list.map(format => format.split('/'))
        : [];

      info.formats = parseFormats(info);

      // Add additional properties to info.
      Object.assign(info, additional, {
        // Give the standard link to the video.
        video_url: VIDEO_URL + id,

        // Copy over a few props from `player_response.videoDetails`
        // for bakcwards compatibility.
        title: info.player_response.videoDetails.title,
        length_seconds: info.player_response.videoDetails.lengthSeconds
      });
      info.age_restricted = fromEmbed;
      info.html5player = config.assets.js;

      callback(null, info);
    })
    .catch(callback);
};

/**
 * Gets info from a video additional formats and deciphered URLs.
 *
 * @param {string} id
 * @param {Object} options
 * @param {Function(Error, Object)} callback
 */
export const getFullInfo = (id, options, callback) => {
  return getBasicInfo(id, options, async (err, info) => {
    if (err) return callback(err);

    const hasManifest =
      info.player_response &&
      info.player_response.streamingData &&
      (info.player_response.streamingData.dashManifestUrl ||
        info.player_response.streamingData.hlsManifestUrl);

    if (info.formats.length || hasManifest) {
      const html5playerfile = urllib.resolve(VIDEO_URL, info.html5player);

      try {
        const tokens = await sig.getTokens(html5playerfile, options);

        sig.decipherFormats(info.formats, tokens, options.debug);

        let funcs = [];

        if (hasManifest && info.player_response.streamingData.dashManifestUrl) {
          let url = info.player_response.streamingData.dashManifestUrl;
          funcs.push(getDashManifest(url, options));
        } else {
          funcs.push(null);
        }

        if (hasManifest && info.player_response.streamingData.hlsManifestUrl) {
          let url = info.player_response.streamingData.hlsManifestUrl;
          funcs.push(getM3U8(url, options));
        } else {
          funcs.push(null);
        }

        const [dash, m3u8] = await Promise.all(funcs);

        if (dash) {
          mergeFormats(info, dash);
        }
        if (m3u8) {
          mergeFormats(info, m3u8);
        }

        if (options.debug) {
          info.formats.forEach(format => {
            const itag = format.itag;
            if (!FORMATS[itag]) {
              console.warn(`No format metadata for itag ${itag} found`);
            }
          });
        }

        info.formats.forEach(addFormatMeta);
        info.formats.sort(sortFormats);
        info.full = true;
        callback(null, info);
      } catch (err) {
        return callback(err);
      }
    } else {
      callback(Error('This video is unavailable'));
    }
  });
};

/**
 * Merges formats from DASH or M3U8 with formats from video info page.
 *
 * @param {Object} info
 * @param {Object} formatsMap
 */
const mergeFormats = (info, formatsMap) => {
  info.formats.forEach(f => {
    if (!formatsMap[f.itag]) {
      formatsMap[f.itag] = f;
    }
  });
  info.formats = [];
  for (let itag in formatsMap) {
    info.formats.push(formatsMap[itag]);
  }
};

/**
 * Gets additional DASH formats.
 *
 * @param {string} url
 * @param {Object} options
 * @param {Function(!Error, Array.<Object>)} callback
 */
const getDashManifest = async (url: string, options) => {
  let formats = {};

  const parser = sax.parser(false);
  parser.onerror = Promise.reject;
  parser.onopentag = node => {
    if (node.name === 'REPRESENTATION') {
      const itag = node.attributes.ID;
      formats[itag] = { itag, url };
    }
  };
  parser.onend = () => {
    return Promise.resolve(formats);
  };

  const res = await axios.get(
    urllib.resolve(VIDEO_URL, url),
    options.requestOptions
  );

  parser.write(res.data).close();
};

/**
 * Gets additional formats.
 *
 * @param {string} url
 * @param {Object} options
 * @param {Function(!Error, Array.<Object>)} callback
 */
const getM3U8 = async (url: string, options) => {
  url = urllib.resolve(VIDEO_URL, url);
  const res = await axios(url, options.requestOptions);

  const body = res.data;
  let formats = {};

  body
    .split('\n')
    .filter(line => /https?:\/\//.test(line))
    .forEach(line => {
      const itag = line.match(/\/itag\/(\d+)\//)[1];
      formats[itag] = { itag: itag, url: line };
    });

  return formats;
};

// Cached for getting basic/full info.
export const cache = new Map();
cache.timeout = 1000;

// // Cache get info functions.
// // In case a user wants to get a video's info before downloading.
// for (let fnName of ["getBasicInfo", "getFullInfo"]) {
//   /**
//    * @param {string} link
//    * @param {Object} options
//    * @param {Function(Error, Object)} callback
//    */
//   const fn = exports[fnName];
//   exports[fnName] = (link, options, callback) => {
//     if (typeof options === "function") {
//       callback = options;
//       options = {};
//     } else if (!options) {
//       options = {};
//     }

//     if (!callback) {
//       return new Promise((resolve, reject) => {
//         exports[fnName](link, options, (err, info) => {
//           if (err) return reject(err);
//           resolve(info);
//         });
//       });
//     }

//     const id = getVideoID(link);
//     if (id instanceof Error) return callback(id);

//     const key = [fnName, id, options.lang].join("-");
//     if (cache.has(key)) {
//       callback(null, cache.get(key));
//     } else {
//       fn(id, options, (err, info) => {
//         if (err) return callback(err);
//         cache.set(key, info);
//         setTimeout(() => {
//           cache.delete(key);
//         }, cache.timeout);
//         callback(null, info);
//       });
//     }
//   };
// }
