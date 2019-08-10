import 'react-native';
import React from 'react';
import Comment from '../src/components/Comment';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

it('renders correctly with an author, profile image, and text', () => {
  const tree = renderer
    .create(
      <Comment
        author="John"
        profileImageUrl="https://via.placeholder.com/150"
        text="Test comment"
      />
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});
