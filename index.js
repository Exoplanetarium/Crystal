/**
 * @format
 */

import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import App from './App';
import Constants from 'expo-constants';
console.log(Constants.systemFonts);

registerRootComponent(App);
