/**
 * @format
 */

import React, { Component, Fragment } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { AllHtmlEntities } from 'html-entities';
import cheerio from 'cheerio-without-node-native';
// import Orientation from 'react-native-orientation';
import Orientation from 'react-native-orientation-locker';

type Props = {};

const { width } = Dimensions.get('window');

export default class Home extends Component<Props> {
  static navigationOptions = {
    headerLeft: () => (
      <Image
        source={require('../images/yt_logo_rgb_light.png')}
        resizeMode="contain"
        style={{ width: 100, marginLeft: 20 }}
      />
    )
  };
  state = {
    refreshing: false,
    videos: []
  };

  componentDidMount() {
    Orientation.lockToPortrait();
    this.fetchVideos();
  }

  fetchVideos = async () => {
    const url = 'https://www.youtube.com';
    const res = await fetch(url);
    const htmlString = await res.text();
    const $ = cheerio.load(htmlString);

    const ytShelfGridItem = $('li.yt-shelf-grid-item');

    const data = ytShelfGridItem.map((_, li) => {
      const ytLockupContent = $('.yt-lockup-content', li);

      const link = ytLockupContent.find('.yt-lockup-title a');
      const href = link.attr('href');
      const title = link.attr('title');
      const id = href.split('?v=')[1];

      const bylineLink = ytLockupContent.find('.yt-lockup-byline a');
      const user = bylineLink.text();

      const metadata = ytLockupContent.find('.yt-lockup-meta-info');
      const views =
        metadata.children()[0] &&
        metadata.children()[0].children &&
        metadata.children()[0].children[0].data
          ? metadata.children()[0].children[0].data
          : '';
      const days =
        metadata.children()[1] &&
        metadata.children()[1].children &&
        metadata.children()[1].children[0].data
          ? metadata.children()[1].children[0].data
          : '';

      //   const ytLockupThumbnail = $('.yt-lockup-thumbnail', li);

      //   const thumbnail =
      //     ytLockupThumbnail.find('img').attr('data-thumb') ||
      //     ytLockupThumbnail.find('img').attr('src');

      const thumbnail = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

      return {
        id,
        href,
        title,
        thumbnail,
        user,
        views,
        days
      };
    });

    this.setState({ refreshing: false, videos: data });
  };

  keyExtractor = item => item.id;

  renderItem = ({ item }) => {
    const thumbnailWidth = width;
    const thumbnailHeight = (360 / 480) * width;

    const title = new AllHtmlEntities().decode(item.title);

    return (
      <TouchableWithoutFeedback
        key={item.id.videoId}
        onPress={() => {
          console.log('navigate to video');
          this.props.navigation.navigate('Video', { video: item });
        }}
      >
        <View>
          <View
            style={{
              // height: 270,
              // position: 'relative',
              backgroundColor: '#f4f4f4'
            }}
          >
            <Image
              source={{ uri: item.thumbnail }}
              resizeMode="contain"
              style={{
                //   position: 'absolute',
                //   top: -45,
                height: thumbnailHeight,
                width: thumbnailWidth
              }}
            />
          </View>
          <View
            style={{
              padding: 15,
              paddingBottom: 25,
              backgroundColor: 'white'
            }}
          >
            <Text style={{ fontSize: 17, color: '#141414' }}>{title}</Text>
            <Text style={{ fontSize: 14, color: '#5e5e5e' }}>
              {item.user} &middot; {item.views} &middot; {item.days}
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  render() {
    const { refreshing, videos } = this.state;

    console.log('videos', videos);

    return (
      <Fragment>
        <StatusBar barStyle="dark-content" hidden={false} />
        <FlatList
          data={videos}
          keyExtractor={this.keyExtractor}
          onRefresh={() => {
            this.setState({ refreshing: true });
            this.fetchVideos();
          }}
          refreshing={refreshing}
          renderItem={this.renderItem}
          style={{ flex: 1 }}
        />
      </Fragment>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF'
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5
  }
});
