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

it('renders correctly when API call resolves', done => {
  // Set the mock resolved value
  // This is the equivalent to .then in axios.get().then()
  mockedAxios.get.mockResolvedValue({ data: resolvedComments });

  // Render the Comments component and wait for 500
  const CommentsComponent = renderer.create(
    <Comments videoId="somethingright" />
  );

  setTimeout(() => {
    // Update the snapshot
    const tree = CommentsComponent.toJSON();
    expect(tree).toMatchSnapshot();

    // Get the instance so we can access the state
    const instance = CommentsComponent.getInstance() as renderer.ReactTestInstance &
      Comments;
    if (instance) {
      expect(instance.state.comments.length).toBe(2);
      expect(instance.state.error).toBe(false);
      expect(instance.state.fetching).toBe(false);
    }

    // Manually callback so we can determine when this test is actually done
    done();
  }, 500);
});

it('renders error when API call rejects', done => {
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
