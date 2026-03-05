import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('focus', {
      name: 'Focus Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4dd9ac',
      sound: 'default',
    });
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await AsyncStorage.setItem('push_token', token);
    return token;
  } catch {
    // Fails on physical device without EAS project ID — local notifications still work
    return null;
  }
}

// Schedule daily 8pm streak reminder
export async function scheduleStreakReminder(streakCount: number) {
  await cancelStreakReminder();

  const messages = streakCount === 0
    ? { title: '🎯 Start your streak today', body: 'Stake SOL, focus for 25 minutes. Your future self will thank you.' }
    : streakCount < 7
    ? { title: `🔥 ${streakCount} day streak — don't break it`, body: "You haven't focused today. Stake SOL and protect your streak." }
    : { title: `🔥 ${streakCount} day streak is on the line`, body: `${streakCount} days of discipline. Don't let tonight be the end.` };

  await Notifications.scheduleNotificationAsync({
    identifier: 'streak-reminder',
    content: {
      title: messages.title,
      body: messages.body,
      data: { type: 'streak_reminder' },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
}

export async function cancelStreakReminder() {
  try {
    await Notifications.cancelScheduledNotificationAsync('streak-reminder');
  } catch {}
}

// Schedule a session reminder (for pre-commitment feature)
export async function scheduleSessionReminder(date: Date, taskNote: string) {
  await Notifications.scheduleNotificationAsync({
    identifier: `session-${date.getTime()}`,
    content: {
      title: '⏰ Time to focus',
      body: taskNote
        ? `Your session: "${taskNote}" starts now.`
        : 'Your scheduled focus session starts now.',
      data: { type: 'session_reminder' },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
}

// Schedule weekly Sunday report (Sunday = 1 in Expo's weekday numbering)
export async function scheduleWeeklyReport() {
  try {
    await Notifications.cancelScheduledNotificationAsync('weekly-report');
  } catch {}

  await Notifications.scheduleNotificationAsync({
    identifier: 'weekly-report',
    content: {
      title: '📊 Your weekly Focus report is ready',
      body: 'See how many sessions you completed and how much SOL you earned this week.',
      data: { type: 'weekly_report' },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday
      hour: 9,
      minute: 0,
    },
  });
}

// Immediate completion celebration (only fires if pool reward earned)
export async function sendCompletionNotification(reward: number) {
  if (reward > 0) {
    await Notifications.scheduleNotificationAsync({
      identifier: 'completion',
      content: {
        title: '✦ Session complete — well done, Agent',
        body: `Full stake returned + ${reward.toFixed(4)} SOL bonus from the penalty pool.`,
        data: { type: 'completion' },
        sound: 'default',
      },
      trigger: null,
    });
  }
}