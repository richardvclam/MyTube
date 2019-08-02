import React, { Component, Fragment } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  Text,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { NavigationScreenProp, NavigationState } from 'react-navigation';
import Orientation from 'react-native-orientation-locker';
import cheerio from 'cheerio-without-node-native';
import { AllHtmlEntities } from 'html-entities';
import { IVideo } from '../types/IVideo';

type Navigation = NavigationScreenProp<NavigationState>;

type Props = {
  navigation: Navigation;
};

type State = {
  refreshing: boolean;
  videos: IVideo[];
};

const { width } = Dimensions.get('window');

export default class HomeScreen extends Component<Props, State> {
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
    console.log(htmlString);
    const $ = cheerio.load(htmlString);

    const ytShelfGridItem = $('li.yt-shelf-grid-item');

    const videos: IVideo[] = [];

    ytShelfGridItem.each((i, li) => {
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

      videos.push({
        id,
        href,
        title,
        thumbnail,
        user,
        views,
        days
      });

      // this.setState({ videos });
    });

    this.setState({ refreshing: false, videos });
  };

  keyExtractor = (item: IVideo) => item.id;

  renderItem = ({ item }: { item: IVideo }) => {
    const thumbnailWidth = width;
    const thumbnailHeight = (360 / 480) * width;

    const title = new AllHtmlEntities().decode(item.title);

    return (
      <TouchableWithoutFeedback
        key={item.id}
        onPress={() => {
          console.log('navigate to video');
          this.props.navigation.navigate('Video', { id: item.id, video: item });
        }}
      >
        <View>
          <View
            style={{
              backgroundColor: '#f4f4f4'
            }}
          >
            <Image
              source={{ uri: item.thumbnail }}
              resizeMode="contain"
              style={{
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
