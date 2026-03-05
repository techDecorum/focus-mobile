import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  shields: number;
  lastCompletedDate: string | null;
  shieldUsedDate: string | null;
}

const DEFAULT: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  shields: 0,
  lastCompletedDate: null,
  shieldUsedDate: null,
};

export async function getStreakData(): Promise<StreakData> {
  try {
    const raw = await AsyncStorage.getItem('streak_data');
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch { return DEFAULT; }
}

export async function saveStreakData(data: StreakData) {
  await AsyncStorage.setItem('streak_data', JSON.stringify(data));
}

export async function onSessionCompleted(): Promise<StreakData> {
  const data = await getStreakData();
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (data.lastCompletedDate === today) {
    // Already completed today — no streak change
    return data;
  }

  let newStreak = data.currentStreak;

  if (data.lastCompletedDate === yesterday) {
    // Consecutive day
    newStreak += 1;
  } else if (data.lastCompletedDate !== today) {
    // Streak broken — check if shield available
    if (data.shields > 0 && data.lastCompletedDate) {
      // Shield absorbs the break
      newStreak += 1;
      data.shields -= 1;
      data.shieldUsedDate = today;
    } else {
      newStreak = 1; // Reset
    }
  }

  // Award shield every 7 sessions
  const newShields = newStreak > 0 && newStreak % 7 === 0
    ? data.shields + 1
    : data.shields;

  const updated: StreakData = {
    currentStreak: newStreak,
    longestStreak: Math.max(newStreak, data.longestStreak),
    shields: newShields,
    lastCompletedDate: today,
    shieldUsedDate: data.shieldUsedDate,
  };

  await saveStreakData(updated);
  return updated;
}

export async function checkStreakIntegrity(): Promise<StreakData> {
  const data = await getStreakData();
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  // If last session wasn't today or yesterday, streak is broken
  if (data.lastCompletedDate &&
      data.lastCompletedDate !== today &&
      data.lastCompletedDate !== yesterday) {
    if (data.shields > 0) {
      // Auto-use shield silently
      const updated = { ...data, shields: data.shields - 1, shieldUsedDate: today };
      await saveStreakData(updated);
      return updated;
    }
    const updated = { ...data, currentStreak: 0 };
    await saveStreakData(updated);
    return updated;
  }
  return data;
}