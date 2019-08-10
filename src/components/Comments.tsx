import axios from 'axios';
import React, { Component } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Config from 'react-native-config';

import Comment from './Comment';
import { CommentThread } from '../types';

interface CommentsProps {
  videoId: string;
}

interface State {
  comments: CommentThread[];
  fetching: boolean;
  error: boolean;
}

export default class Comments extends Component<CommentsProps, State> {
  state = {
    comments: [],
    fetching: false,
    error: false
  };

  componentDidMount() {
    this.fetchComments();
  }

  fetchComments = () => {
    const { videoId } = this.props;

    this.setState({ fetching: true, error: false });

    axios
      .get(
        `https://www.googleapis.com/youtube/v3/commentThreads?key=${Config.API_KEY}&part=snippet&videoId=${videoId}&maxResults=50`
      )
      .then(res => {
        console.log('fetched comments', res);
        this.setState({
          comments: res.data.items,
          fetching: false
        });
      })
      .catch(err => {
        console.log('err', err);
        this.setState({ fetching: false, error: true });
      });
  };

  keyExtractor = (item: CommentThread, index: number) => item!.id!;

  renderComment = ({ item }: { item: CommentThread }) => {
    const {
      authorDisplayName,
      authorProfileImageUrl,
      textOriginal
    } = item!.snippet!.topLevelComment!.snippet!;

    return (
      <Comment
        author={authorDisplayName!}
        profileImageUrl={authorProfileImageUrl!}
        text={textOriginal!}
      />
    );
  };

  render() {
    const { comments, fetching, error } = this.state;

    if (!fetching && error) {
      return <Text>An error occured.</Text>;
    }

    if (fetching && comments.length === 0) {
      return <ActivityIndicator />;
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
