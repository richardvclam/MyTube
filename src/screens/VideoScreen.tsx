import React, { Component, Fragment } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Text,
  View,
  TouchableWithoutFeedback
} from 'react-native';
import { NavigationScreenProp, NavigationState } from 'react-navigation';
import Video from 'react-native-video';
import { isIphoneX } from 'react-native-iphone-x-helper';
import Orientation from 'react-native-orientation-locker';
import { TabBar, TabView, SceneMap } from 'react-native-tab-view';
import { AllHtmlEntities } from 'html-entities';
import Animated from 'react-native-reanimated';

import Comments from '../components/Comments';

import { getFullInfo } from '../lib/ytdl/info';
import * as util from '../lib/ytdl/util';

const { width } = Dimensions.get('window');

type Navigation = NavigationScreenProp<NavigationState>;

type Props = {
  navigation: Navigation;
};

export default class VideoScreen extends Component<Props> {
  static navigationOptions = {
    header: null
  };

  state = {
    index: 0,
    routes: [
      { key: 'upNext', title: 'Up Next' },
      { key: 'comments', title: 'Comments' }
    ],
    keyboardDismissMode: 'auto',
    comments: [],
    ready: false,
    videoInfo: {},
    videoUrl: ''
  };

  position = new Animated.Value(0);

  video: Video | null = null;

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
    console.log('Changed orientation', orientation);
    if (orientation === 'LANDSCAPE-LEFT' || orientation === 'LANDSCAPE-RIGHT') {
      this.video!.presentFullscreenPlayer();
    } else {
      this.video!.dismissFullscreenPlayer();
    }
  };

  private handleIndexChange = (index: number) => this.setState({ index });

  private jumpTo = (key: string) => {
    const navigationState = this.state;
    const { keyboardDismissMode } = this.state;

    const index = navigationState.routes.findIndex(route => route.key === key);

    // // A tab switch might occur when we're in the middle of a transition
    // // In that case, the index might be same as before
    // // So we conditionally make the pager to update the position
    // if (navigationState.index === index) {
    //   this.jumpToIndex(index);
    // } else {
    this.handleIndexChange(index);

    // When the index changes, the focused input will no longer be in current tab
    // So we should dismiss the keyboard
    if (keyboardDismissMode === 'auto') {
      Keyboard.dismiss();
    }
    // }
  };

  renderUpNext = () => {
    const { videoInfo } = this.state;
    const { related_videos } = videoInfo;

    return (
      <View style={{ padding: 15, marginBottom: 200 }}>
        {related_videos.map(relatedVideo => {
          if (!relatedVideo.title) return null;

          return (
            <TouchableWithoutFeedback
              key={relatedVideo.id}
              onPress={() => {
                this.props.navigation.popToTop();
                this.props.navigation.navigate('Video', {
                  id: relatedVideo.id,
                  video: {
                    id: relatedVideo.id,
                    title: relatedVideo.title,
                    thumbnail: relatedVideo.iurlhq,
                    views: relatedVideo.short_view_count_text,
                    author: relatedVideo.author
                  }
                });
              }}
              style={{ marginBottom: 15 }}
            >
              <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                <Image
                  source={{ uri: relatedVideo.iurlmq }}
                  resizeMode="contain"
                  style={{ width: 120, height: 75, marginRight: 15 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#141414' }}>{relatedVideo.title}</Text>
                  <Text style={{ color: '#5e5e5e', fontSize: 14 }}>
                    {relatedVideo.author}
                  </Text>
                  <Text style={{ color: '#5e5e5e', fontSize: 14 }}>
                    {relatedVideo.short_view_count_text}
                  </Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          );
        })}
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
          <ScrollView stickyHeaderIndices={[2]}>
            {/* Header */}
            <View style={{ padding: 15 }}>
              <Text style={{ fontSize: 17, color: '#141414', marginBottom: 5 }}>
                {title}{' '}
              </Text>
              <Text style={{ fontSize: 14, color: '#5e5e5e' }}>
                {video.views} &middot; {video.days}
              </Text>
            </View>

            {/* Author */}
            {videoUrl ? (
              <View
                style={{
                  // backgroundColor: 'white',
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
              <View>
                <TabBar
                  position={this.position}
                  jumpTo={this.jumpTo}
                  // tabStyle={{ backgroundColor: 'white' }}
                  style={{ backgroundColor: 'white' }}
                  navigationState={this.state}
                  indicatorStyle={{ backgroundColor: '#141414' }}
                  // indicatorContainerStyle={{ backgroundColor: '#141414' }}
                  activeColor="#141414"
                  inactiveColor="#bbbbbb"
                />
              </View>
            ) : null}

            {videoUrl ? (
              <Fragment>
                <TabView
                  lazy
                  removeClippedSubviews={true}
                  position={this.position}
                  navigationState={this.state}
                  renderScene={({ route }) => {
                    switch (route.key) {
                      case 'upNext':
                        return this.renderUpNext();
                      case 'comments':
                        return <Comments videoId={video.id} />;
                      default:
                        return null;
                    }
                  }}
                  onIndexChange={this.handleIndexChange}
                  initialLayout={{ width }}
                  renderTabBar={() => null}
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
