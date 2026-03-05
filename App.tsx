import './polyfills';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConnection } from '@solana/wallet-adapter-react';

import { SolanaWalletProvider } from './components/WalletProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import { MusicProvider, useMusic } from './contexts/MusicContext';
import { WalletStateProvider, useWallet } from './contexts/WalletContext';
import HomeScreen, { StakeToken } from './components/HomeScreen';
import ActiveScreen from './components/ActiveScreen';
import SuccessScreen from './components/SuccessScreen';
import AbandonedScreen from './components/AbandonedScreen';
import BottomNav, { Screen as NavScreen } from './components/BottomNav';
import MiniPlayer from './components/MiniPlayer';
import FeedScreen from './screens/FeedScreen';
import LibraryScreen from './screens/LibraryScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import WeeklyReportScreen from './screens/WeeklyReportScreen';
import SessionSchedulingModal from './components/SessionSchedulingModal';
import StreakLeaderboardScreen from './screens/StreakLeaderboardScreen';

import {
  registerForPushNotifications,
  scheduleStreakReminder,
  scheduleWeeklyReport,
} from './services/NotificationService';
import { checkStreakIntegrity } from './services/StreakService';

type AppScreen = 'home' | 'active' | 'success' | 'abandoned';

function AppInner() {
  const { connection } = useConnection();
  const { setSessionActive } = useMusic();
  const { publicKey } = useWallet();  // persistent across nav

  const [appScreen, setAppScreen] = useState<AppScreen>('home');
  const [navScreen, setNavScreen] = useState<NavScreen>('home');
  const [duration, setDuration] = useState(25);
  const [stakeAmount, setStakeAmount] = useState(0.01);
  const [stakeToken, setStakeToken] = useState<StakeToken>('SOL');
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [poolReward, setPoolReward] = useState(0);
  const [taskNote, setTaskNote] = useState('');
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [weeklyReportOpen, setWeeklyReportOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [hintTrigger, setHintTrigger] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem('onboarding_done').then(val => {
      setOnboardingDone(val === 'true');
    });
  }, []);

  useEffect(() => {
    const init = async () => {
      await registerForPushNotifications();
      const streakData = await checkStreakIntegrity();
      await scheduleStreakReminder(streakData.currentStreak);
      await scheduleWeeklyReport();
    };
    init();

    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const type = response.notification.request.content.data?.type;
      if (type === 'weekly_report') { setNavScreen('history'); setWeeklyReportOpen(true); }
      if (type === 'streak_reminder' || type === 'session_reminder') setNavScreen('home');
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    setSessionActive(appScreen === 'active');
  }, [appScreen]);

  if (onboardingDone === null) return null;

  if (!onboardingDone) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <OnboardingScreen onDone={async () => {
          await AsyncStorage.setItem('onboarding_done', 'true');
          setOnboardingDone(true);
        }} />
      </View>
    );
  }

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
            onStart={(dur, stake, task, token) => {
              setDuration(dur);
              setStakeAmount(stake);
              setTaskNote(task);
              setStakeToken(token);
              setAppScreen('active');
            }}
            onShowInfo={() => setOnboardingOpen(true)}
            hintTrigger={hintTrigger}
          />
        );
      case 'feed':    return <FeedScreen />;
      case 'library': return <LibraryScreen />;
      case 'history':
        return <HistoryScreen onShowWeeklyReport={() => setWeeklyReportOpen(true)} />;
      case 'settings':
        return (
          <SettingsScreen
            onShowInfo={() => setOnboardingOpen(true)}
            onShowLeaderboard={() => setLeaderboardOpen(true)}
            onShowSchedule={() => setScheduleOpen(true)}
            onStartFirstSession={() => { setNavScreen('home'); setHintTrigger(k => k + 1); }}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>{renderScreen()}</View>

      {showNav && <MiniPlayer />}
      {showNav && <BottomNav active={navScreen} onNavigate={handleNavigate} />}

      <Modal visible={onboardingOpen} animationType="slide">
        <OnboardingScreen onDone={async () => {
          await AsyncStorage.setItem('onboarding_done', 'true');
          setOnboardingDone(true);
          setOnboardingOpen(false);
        }} />
      </Modal>

      <Modal visible={weeklyReportOpen} animationType="slide">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setWeeklyReportOpen(false)}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <WeeklyReportScreen />
        </View>
      </Modal>

      <Modal visible={leaderboardOpen} animationType="slide">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setLeaderboardOpen(false)}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <StreakLeaderboardScreen />
        </View>
      </Modal>

      <SessionSchedulingModal visible={scheduleOpen} onClose={() => setScheduleOpen(false)} />
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MusicProvider>
        <SolanaWalletProvider>
          <WalletStateProvider>
            <AppInner />
          </WalletStateProvider>
        </SolanaWalletProvider>
      </MusicProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060d12' },
  content: { flex: 1 },
  modalContainer: { flex: 1, backgroundColor: '#060d12', paddingTop: 60 },
  backBtn: { paddingHorizontal: 24, paddingBottom: 8 },
  backBtnText: { color: '#4dd9ac', fontSize: 14 },
});