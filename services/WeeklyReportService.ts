import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStreakData } from './StreakService';

export interface WeeklyStats {
  sessionsCompleted: number;
  sessionsAbandoned: number;
  totalMinutes: number;
  solStaked: number;
  solEarned: number;
  currentStreak: number;
  longestStreak: number;
  shields: number;
  weekStart: string;
  weekEnd: string;
}

export async function getWeeklyStats(): Promise<WeeklyStats> {
  try {
    const raw = await AsyncStorage.getItem('focus_history');
    const history = raw ? JSON.parse(raw) : [];
    const streakData = await getStreakData();

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const thisWeek = history.filter((h: any) => {
      const date = new Date(h.completedAt);
      return date >= weekStart;
    });

    const completed = thisWeek.filter((h: any) => h.status === 'completed');
    const abandoned = thisWeek.filter((h: any) => h.status === 'abandoned');

    return {
      sessionsCompleted: completed.length,
      sessionsAbandoned: abandoned.length,
      totalMinutes: completed.reduce((acc: number, h: any) => acc + (h.duration || 0), 0),
      solStaked: completed.reduce((acc: number, h: any) => acc + (h.stakeAmount || 0), 0),
      solEarned: completed.reduce((acc: number, h: any) => acc + (h.reward || 0), 0),
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      shields: streakData.shields,
      weekStart: weekStart.toLocaleDateString(),
      weekEnd: now.toLocaleDateString(),
    };
  } catch {
    return {
      sessionsCompleted: 0, sessionsAbandoned: 0, totalMinutes: 0,
      solStaked: 0, solEarned: 0, currentStreak: 0, longestStreak: 0,
      shields: 0, weekStart: '', weekEnd: '',
    };
  }
}