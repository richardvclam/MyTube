import React, { Component, Fragment } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Text,
  View
} from 'react-native';
import Video from 'react-native-video';
import { AllHtmlEntities } from 'html-entities';
import { isIphoneX } from 'react-native-iphone-x-helper';
import { TabBar, TabView, SceneMap } from 'react-native-tab-view';
// import Orientation, { orientation } from 'react-native-orientation';
import Orientation from 'react-native-orientation-locker';
import { getFullInfo } from '../lib/ytdl/info';
import * as util from '../lib/ytdl/util';

const { width } = Dimensions.get('window');

export default class VideoScreen extends Component {
  static navigationOptions = {
    header: null
  };

  state = {
    index: 0,
    routes: [
      { key: 'upNext', title: 'Up Next' },
      { key: 'comments', title: 'Comments' }
    ],
    ready: false,
    videoInfo: {},
    videoUrl: ''
  };

  video: Video | null;

  componentDidMount() {
    const video = this.props.navigation.getParam('video');

    Orientation.unlockAllOrientations();
    Orientation.addOrientationListener(this.handleOrientationChange);

    getFullInfo(video.id, { quality: 'lowest' }, (err, info) => {
      if (err) {
        console.warn(err);
        return;
      }

      const format = util.chooseFormat(info.formats, {
        quality: 'lowest'
      });

      this.setState({
        videoInfo: info,
        videoUrl: format.url
      });
    });
  }

  componentWillUnmount() {
    Orientation.removeOrientationListener(this.handleOrientationChange);
    Orientation.lockToPortrait();
  }

  handleOrientationChange = orientation => {
    console.log('changed', orientation);
    if (orientation === 'LANDSCAPE-LEFT' || orientation === 'LANDSCAPE-RIGHT') {
      // setTimeout(() => {
      this.video.presentFullscreenPlayer();
      // }, 2000);
    } else {
      this.video.dismissFullscreenPlayer();
    }
  };

  renderTabBar = props => (
    <TabBar
      {...props}
      style={{ backgroundColor: 'white' }}
      // labelStyle={{ color: '#141414' }}
      indicatorStyle={{ backgroundColor: '#141414' }}
      activeColor="#141414"
      inactiveColor="#bbbbbb"
    />
  );

  renderUpNext = () => {
    const { videoInfo } = this.state;
    const { related_videos } = videoInfo;

    return (
      <View style={{ padding: 15, marginBottom: 200 }}>
        {related_videos.map(relatedVideo => {
          if (!relatedVideo.title) return null;

          return (
            <View
              key={relatedVideo.id}
              style={{ flexDirection: 'row', marginBottom: 15 }}
            >
              <Image
                source={{ uri: relatedVideo.iurlmq }}
                resizeMode="contain"
                style={{ width: 120, height: 75, marginRight: 15 }}
              />
              <View style={{ flex: 1 }}>
                <Text>{relatedVideo.title}</Text>
                <Text>{relatedVideo.author}</Text>
                <Text>{relatedVideo.short_view_count_text}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  renderComments = () => {
    return (
      <View style={{ padding: 15, marginBottom: 200 }}>
        <Text>Some comments</Text>
      </View>
    );
  };

  render() {
    const { ready, videoInfo, videoUrl } = this.state;
    const { author } = videoInfo;

    const video = this.props.navigation.getParam('video');

    const title = new AllHtmlEntities().decode(video.title);

    console.log('videoInfo', videoInfo);
    console.log('videourl', videoUrl);

    return (
      <Fragment>
        <StatusBar hidden={!isIphoneX()} />
        <SafeAreaView style={{ backgroundColor: 'white' }}>
          {/* Video Container */}
          <View style={{ position: 'relative' }}>
            <Video
              ref={ref => {
                this.video = ref;
              }}
              bufferConfig={{
                minBufferMs: 5000,
                bufferForPlaybackMs: 1000,
                bufferForPlaybackAfterRebufferMs: 2500
              }}
              controls={false}
              fullscreenAutorotate={true}
              fullscreenOrientation="landscape"
              ignoreSilentSwitch="ignore"
              muted={false}
              playInBackground={true}
              poster={video.thumbnail}
              // onFullscreenPlayerWillDismiss={}
              onLoad={payload => {
                this.setState({ ready: true });
                console.log('loaded', payload);
              }}
              onError={err => {
                console.warn('videoerror', err);
              }}
              source={{
                uri: videoUrl
              }}
              style={{
                width,
                height: width * (9 / 16),
                backgroundColor: 'black'
              }}
            />
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

          {/* Body */}
          <ScrollView>
            {/* Header */}
            <View style={{ padding: 15 }}>
              <Text style={{ fontSize: 17, color: '#141414', marginBottom: 5 }}>
                {title}{' '}
              </Text>
              <Text style={{ fontSize: 14, color: '#5e5e5e' }}>
                {video.views}
              </Text>
            </View>

            {videoUrl ? (
              <View
                style={{
                  borderColor: '#dddddd',
                  borderTopWidth: 1,
                  borderBottomWidth: 1,
                  paddingHorizontal: 15,
                  paddingVertical: 10,
                  height: 65,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image
                    source={{ uri: author.avatar }}
                    resizeMode="contain"
                    style={{
                      width: 45,
                      height: 45,
                      marginRight: 15,
                      borderRadius: 23
                    }}
                  />
                  <Text style={{ fontSize: 17, color: '#141414' }}>
                    {author.name}
                  </Text>
                </View>
              </View>
            ) : null}

            {videoUrl ? (
              <Fragment>
                <TabView
                  navigationState={this.state}
                  renderScene={SceneMap({
                    upNext: this.renderUpNext,
                    comments: this.renderComments
                  })}
                  onIndexChange={index => this.setState({ index })}
                  initialLayout={{ width }}
                  renderTabBar={this.renderTabBar}
                />
              </Fragment>
            ) : null}

            {!videoUrl ? (
              <View style={{ flex: 1, alignItems: 'center' }}>
                <ActivityIndicator />
              </View>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Fragment>
    );
  }
}
