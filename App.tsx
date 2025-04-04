import React from 'react';
import Search from './components/Search';
import { createTamagui, TamaguiProvider } from 'tamagui';
import defaultConfig from '@tamagui/config/v3';
import { ReportScoreProvider } from './components/ReportScoreContext';
const config = createTamagui(defaultConfig);

const App = () => {
  return (
    <TamaguiProvider config={config}>
      <ReportScoreProvider>
        <Search />
      </ReportScoreProvider>
    </TamaguiProvider>
  );
};

export default App;
