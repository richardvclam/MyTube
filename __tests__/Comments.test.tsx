import axios from 'axios';
import 'react-native';
import React from 'react';
import Comments from '../src/components/Comments';
import resolvedComments from './comments.resolve.json';
import rejectedComments from './comments.reject.json';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';
import { Text } from 'react-native';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// it('renders correctly', () => {
//   mockedAxios.get.mockResolvedValue({ data: resolvedComments });
//   const tree = renderer.create(<Comments videoId="WZSuU1gdJTg" />).toJSON();
//   expect(tree).toMatchSnapshot();
// });

it('renders correctly with a valid video id', done => {
  mockedAxios.get.mockResolvedValue({ data: resolvedComments });
  const CommentsComponent = renderer.create(<Comments videoId="WZSuU1gdJTg" />);
  setTimeout(() => {
    const tree = CommentsComponent.toJSON();
    expect(tree).toMatchSnapshot();
    done();
  }, 500);
});

it('renders throws error with invalid video id', done => {
  mockedAxios.get.mockRejectedValue({ data: rejectedComments });
  const CommentsComponent = renderer.create(
    <Comments videoId="somethingwrong" />
  );
  setTimeout(() => {
    const tree = CommentsComponent.toJSON();
    expect(tree).toMatchSnapshot();

    const instance = CommentsComponent.getInstance() as renderer.ReactTestInstance &
      Comments;
    if (instance) {
      expect(instance.state.error).toBe(true);
    }

    expect(CommentsComponent.root.findByType(Text).props.children).toBe(
      'An error occured.'
    );

    done();
  }, 500);
});
