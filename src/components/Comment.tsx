import React, { Component } from 'react';
import { Image, Text, View } from 'react-native';
import { AllHtmlEntities } from 'html-entities';

type Props = {
  author: string;
  profileImageUrl: string;
  text: string;
};

export default class Comment extends Component<Props> {
  render() {
    const { author, profileImageUrl, text } = this.props;

    const decodedText = new AllHtmlEntities().decode(text);

    return (
      <View style={{ padding: 15, flexDirection: 'row' }}>
        <Image
          source={{
            uri: profileImageUrl
          }}
          style={{ width: 45, height: 45, marginRight: 15, borderRadius: 23 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#5e5e5e', fontSize: 14 }}>{author}</Text>
          <Text style={{ color: '#141414' }}>{decodedText}</Text>
        </View>
      </View>
    );
  }
}
