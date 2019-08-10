import 'react-native';
import React from 'react';
import Comments from '../src/components/Comments';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

it('renders correctly', () => {
  const tree = renderer.create(<Comments videoId="WZSuU1gdJTg" />).toJSON();
  expect(tree).toMatchSnapshot();
});

// it('renders correctly with a valid video id', () => {
//   const CommentsComponent = mount(<Comments videoId="WZSuU1gdJTg" />).toJSON();
//   expect(tree).toMatchSnapshot();
// });

// it('renders throws error with invalid video id', () => {
//   const ModifiedComments = Comments;
//   ModifiedComments.componentDidMount = () => {}

//   const tree = renderer
//     .create(<ModifiedComments videoId="WZSuU1gdJTgasdfsad" />)
//     .toJSON();
//   expect(tree).toMatchSnapshot();
// });
