import './polyfills';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SolanaWalletProvider } from './components/WalletProvider';
import HomeScreen from './components/HomeScreen';
import ActiveScreen from './components/ActiveScreen';
import SuccessScreen from './components/SuccessScreen';
import AbandonedScreen from './components/AbandonedScreen';
import { PublicKey } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';

type Screen = 'home' | 'active' | 'success' | 'abandoned';

function AppInner() {
  const { connection } = useConnection();
  const [screen, setScreen] = useState<Screen>('home');
  const [duration, setDuration] = useState(25);
  const [stakeAmount, setStakeAmount] = useState(0.01);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [poolReward, setPoolReward] = useState(0);

  return (
    <>
      <StatusBar style="light" />
      {screen === 'home' && (
        <HomeScreen
          onStart={(dur, stake, pubkey) => {
            setDuration(dur);
            setStakeAmount(stake);
            setPublicKey(pubkey);
            setScreen('active');
          }}
        />
      )}
      {screen === 'active' && publicKey && (
        <ActiveScreen
          duration={duration}
          stakeAmount={stakeAmount}
          publicKey={publicKey}
          connection={connection}
          onComplete={(sig, reward) => {
            setTxSignature(sig);
            setPoolReward(reward);
            setScreen('success');
          }}
          onAbandon={(sig) => {
            if (sig !== 'cancelled') setTxSignature(sig);
            setScreen(sig === 'cancelled' ? 'home' : 'abandoned');
          }}
        />
      )}
      {screen === 'success' && (
        <SuccessScreen
          duration={duration}
          stakeAmount={stakeAmount}
          poolReward={poolReward}
          txSignature={txSignature}
          onReset={() => setScreen('home')}
        />
      )}
      {screen === 'abandoned' && (
        <AbandonedScreen
          stakeAmount={stakeAmount}
          txSignature={txSignature}
          onReset={() => setScreen('home')}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <SolanaWalletProvider>
      <AppInner />
    </SolanaWalletProvider>
  );
}