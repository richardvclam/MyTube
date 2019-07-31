import { createAppContainer, createStackNavigator } from 'react-navigation';
import HomeScreen from '../screens/HomeScreen';
import VideoScreen from '../screens/VideoScreen';

const AppStack = createStackNavigator(
  { Home: HomeScreen, Video: VideoScreen },
  {
    initialRouteName: 'Home',
    mode: 'modal'
  }
);

export default createAppContainer(AppStack);
