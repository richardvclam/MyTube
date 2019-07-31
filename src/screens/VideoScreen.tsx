import React, { Component, Fragment } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Text,
  View
} from 'react-native';
import Video from 'react-native-video';
import { AllHtmlEntities } from 'html-entities';
import { getFullInfo } from '../lib/ytdl/info';
import * as util from '../lib/ytdl/util';

const { width } = Dimensions.get('window');

export default class VideoScreen extends Component {
  static navigationOptions = {
    header: null
  };
  state = {
    // videoUrl: "http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4"
    ready: false,
    videoUrl: ''
  };

  componentDidMount() {
    const video = this.props.navigation.getParam('video');

    getFullInfo(video.id, {}, (err, info) => {
      if (err) {
        console.warn(err);
        return;
      }

      const format = util.chooseFormat(info.formats, {});

      console.log('info', info);

      this.setState({ videoUrl: format.url });
    });
  }

  render() {
    const { ready, videoUrl } = this.state;
    const video = this.props.navigation.getParam('video');
    console.log('video', video);
    console.log('videoUrl', this.state.videoUrl);

    const title = new AllHtmlEntities().decode(video.title);

    return (
      <Fragment>
        <StatusBar hidden={true} />
        <SafeAreaView style={{ backgroundColor: 'white' }}>
          <View style={{ position: 'relative' }}>
            {videoUrl ? (
              <Video
                bufferConfig={{
                  minBufferMs: 5000,
                  bufferForPlaybackMs: 1000,
                  bufferForPlaybackAfterRebufferMs: 2500
                }}
                controls={true}
                fullscreenAutorotate={true}
                fullscreenOrientation="landscape"
                // source={{ uri: `https://www.youtube.com/embed/${video.id.videoId}` }}

                playInBackground={true}
                onLoad={() => this.setState({ ready: true })}
                source={{
                  uri: this.state.videoUrl
                }}
                style={{ width, height: 300, backgroundColor: 'black' }}
              />
            ) : (
              <View
                style={{
                  width,
                  height: 300,
                  backgroundColor: 'black',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              ></View>
            )}
            {!ready && (
              <ActivityIndicator
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0
                }}
              />
            )}
          </View>
          {/* <YouTube
          apiKey={config.apiKey}
          videoId={video.id.videoId} // The YouTube video ID
          play={true} // control playback of video with true/false
          fullscreen={false} // control whether the video should play in fullscreen or inline
          loop={false} // control whether the video should loop when ended
          controls={0}
          showinfo={false}
          onReady={e => this.setState({ isReady: true })}
          onChangeState={e => this.setState({ status: e.state })}
          onChangeQuality={e => this.setState({ quality: e.quality })}
          onError={e => this.setState({ error: e.error })}
          style={{ alignSelf: "stretch", height: 300 }}
        /> */}

          <View style={{ padding: 15 }}>
            <Text style={{ fontSize: 17, color: '#141414', marginBottom: 5 }}>
              {title}{' '}
            </Text>
            <Text style={{ fontSize: 14, color: '#5e5e5e' }}>
              {video.views}
            </Text>
          </View>
        </SafeAreaView>
      </Fragment>
    );
  }
}
