import React, { Component } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import axios from 'axios';
import Config from 'react-native-config';
import Comment from './Comment';

type Props = {
  videoId: string;
};

export default class Comments extends Component<Props> {
  state = {
    comments: [],
    fetching: true
  };

  componentDidMount() {
    this.fetchComments();
  }

  fetchComments = () => {
    const { videoId } = this.props;

    this.setState({ fetching: true });

    axios
      .get(
        `https://www.googleapis.com/youtube/v3/commentThreads?key=${Config.API_KEY}&part=snippet&videoId=${videoId}&maxResults=50`
      )
      .then(res => {
        console.log('fetched comments');
        this.setState({
          comments: res.data.items,
          fetching: false
        });
      })
      .catch(() => {
        this.setState({ fetching: false });
      });
  };

  private keyExtractor = item => item.id;

  private renderComment = ({ item }) => {
    const {
      authorDisplayName,
      authorProfileImageUrl,
      textOriginal
    } = item.snippet.topLevelComment.snippet;

    return (
      <Comment
        author={authorDisplayName}
        profileImageUrl={authorProfileImageUrl}
        text={textOriginal}
      />
    );
  };

  render() {
    const { comments, fetching } = this.state;

    if (fetching && comments.length === 0) {
      <ActivityIndicator />;
    }

    return (
      <FlatList
        data={comments}
        keyExtractor={this.keyExtractor}
        ItemSeparatorComponent={() => (
          <View
            style={{
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderColor: '#bbbbbb'
            }}
          />
        )}
        renderItem={this.renderComment}
      />
    );
  }
}
