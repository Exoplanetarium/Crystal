import React from 'react';
import Search from './components/Search';
import { NavigationContainer } from '@react-navigation/native';
import { createTamagui, TamaguiProvider } from 'tamagui';
import defaultConfig from '@tamagui/config/v3';

const config = createTamagui(defaultConfig);

const App = () => {
  return (
    <TamaguiProvider config={config}>
      <NavigationContainer>
        <Search />
      </NavigationContainer>
    </TamaguiProvider>
  );
};

export default App;
