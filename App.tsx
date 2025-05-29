import React from 'react';
import Search from './components/Search';
import { createTamagui, TamaguiProvider } from 'tamagui';
import defaultConfig from '@tamagui/config/v3';
import { ReportScoreProvider } from './components/ReportScoreContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const config = createTamagui(defaultConfig);

const App = () => {
  return (
    <TamaguiProvider config={config}>
      <GestureHandlerRootView>
        <ReportScoreProvider>
          <Search />
        </ReportScoreProvider>
      </GestureHandlerRootView>
    </TamaguiProvider>
  );
};

export default App;
