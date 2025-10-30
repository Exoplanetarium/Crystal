import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React from 'react';
import Search from './components/Search';
import { TamaguiProvider } from 'tamagui';
import { ReportScoreProvider } from './components/ReportScoreContext';
import config from './tamagui.config';

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
