import './polyfills';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SolanaWalletProvider } from './components/WalletProvider';
import HomeScreen from './components/HomeScreen';
import ActiveScreen from './components/ActiveScreen';
import SuccessScreen from './components/SuccessScreen';
import AbandonedScreen from './components/AbandonedScreen';

type Screen = 'home' | 'active' | 'success' | 'abandoned';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [duration, setDuration] = useState(25);
  const [stakeAmount, setStakeAmount] = useState(0.01);

  return (
    <SolanaWalletProvider>
      <StatusBar style="light" />
      {screen === 'home' && (
        <HomeScreen
          onStart={(dur, stake) => {
            setDuration(dur);
            setStakeAmount(stake);
            setScreen('active');
          }}
        />
      )}
      {screen === 'active' && (
        <ActiveScreen
          duration={duration}
          stakeAmount={stakeAmount}
          onComplete={() => setScreen('success')}
          onAbandon={() => setScreen('abandoned')}
        />
      )}
      {screen === 'success' && (
        <SuccessScreen
          duration={duration}
          stakeAmount={stakeAmount}
          onReset={() => setScreen('home')}
        />
      )}
      {screen === 'abandoned' && (
        <AbandonedScreen
          stakeAmount={stakeAmount}
          onReset={() => setScreen('home')}
        />
      )}
    </SolanaWalletProvider>
  );
}