// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const singleton = (m) => path.resolve(__dirname, 'node_modules', m);
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'tamagui': singleton('tamagui'),
  '@tamagui/core': singleton('@tamagui/core'),
  '@tamagui/web': singleton('@tamagui/web'),
  '@tamagui/constants': singleton('@tamagui/constants'),
  '@tamagui/portal': singleton('@tamagui/portal'),
  '@tamagui/react-native-media-driver': singleton('@tamagui/react-native-media-driver'),
};

module.exports = config;
