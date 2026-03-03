import './polyfills';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SolanaWalletProvider } from './components/WalletProvider';
import HomeScreen from './components/HomeScreen';
import ActiveScreen from './components/ActiveScreen';
import SuccessScreen from './components/SuccessScreen';
import AbandonedScreen from './components/AbandonedScreen';
import BottomNav, { Screen as NavScreen } from './components/BottomNav';
import FeedScreen from './screens/FeedScreen';
import LibraryScreen from './screens/LibraryScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import { PublicKey } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';

type AppScreen = 'home' | 'active' | 'success' | 'abandoned';

function AppInner() {
  const { connection } = useConnection();
  const [appScreen, setAppScreen] = useState<AppScreen>('home');
  const [navScreen, setNavScreen] = useState<NavScreen>('home');
  const [duration, setDuration] = useState(25);
  const [stakeAmount, setStakeAmount] = useState(0.01);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [poolReward, setPoolReward] = useState(0);
  const [taskNote, setTaskNote] = useState('');

  const showNav = appScreen !== 'active';

  const handleNavigate = (screen: NavScreen) => {
    setNavScreen(screen);
    setAppScreen('home');
  };

  const renderScreen = () => {
    if (appScreen === 'active' && publicKey) {
      return (
        <ActiveScreen
          duration={duration}
          stakeAmount={stakeAmount}
          publicKey={publicKey}
          connection={connection}
          taskNote={taskNote}
          onComplete={(sig, reward) => {
            setTxSignature(sig);
            setPoolReward(reward);
            setAppScreen('success');
          }}
          onAbandon={(sig) => {
            if (sig !== 'cancelled') setTxSignature(sig);
            setAppScreen(sig === 'cancelled' ? 'home' : 'abandoned');
          }}
        />
      );
    }

    if (appScreen === 'success') {
      return (
        <SuccessScreen
          duration={duration}
          stakeAmount={stakeAmount}
          poolReward={poolReward}
          txSignature={txSignature}
          taskNote={taskNote}
          onReset={() => { setAppScreen('home'); setNavScreen('home'); }}
        />
      );
    }

    if (appScreen === 'abandoned') {
      return (
        <AbandonedScreen
          stakeAmount={stakeAmount}
          txSignature={txSignature}
          taskNote={taskNote}
          onReset={() => { setAppScreen('home'); setNavScreen('home'); }}
        />
      );
    }

    switch (navScreen) {
      case 'home':
        return (
          <HomeScreen
            onStart={(dur, stake, pubkey, task) => {
              setDuration(dur);
              setStakeAmount(stake);
              setPublicKey(pubkey);
              setTaskNote(task);
              setAppScreen('active');
            }}
          />
        );
      case 'feed':     return <FeedScreen />;
      case 'library':  return <LibraryScreen />;
      case 'history':  return <HistoryScreen />;
      case 'settings': return <SettingsScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        {renderScreen()}
      </View>
      {showNav && (
        <BottomNav active={navScreen} onNavigate={handleNavigate} />
      )}
    </View>
  );
}

import { ThemeProvider } from './contexts/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <SolanaWalletProvider>
        <AppInner />
      </SolanaWalletProvider>
    </ThemeProvider>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060d12' },
  content: { flex: 1 },
});