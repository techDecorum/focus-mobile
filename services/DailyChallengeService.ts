import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  requirement: {
    minDuration?: number; // minutes
    beforeHour?: number;  // complete before this hour
    minStake?: number;    // minimum SOL stake
    sessions?: number;    // number of sessions
  };
  reward: string;
  completed: boolean;
  date: string;
}

const CHALLENGE_POOL: Omit<DailyChallenge, 'id' | 'completed' | 'date'>[] = [
  {
    title: 'Early Bird',
    description: 'Complete a 25-min session before noon',
    emoji: '🌅',
    requirement: { minDuration: 25, beforeHour: 12 },
    reward: 'Extra pool share + 🌅 badge',
  },
  {
    title: 'Deep Diver',
    description: 'Complete a 50-min deep work session',
    emoji: '🤿',
    requirement: { minDuration: 50 },
    reward: '2x pool share on completion',
  },
  {
    title: 'High Roller',
    description: 'Stake 0.1 SOL or more in a single session',
    emoji: '💎',
    requirement: { minStake: 0.1 },
    reward: 'Top pool priority today',
  },
  {
    title: 'Double Down',
    description: 'Complete 2 sessions today',
    emoji: '⚡',
    requirement: { sessions: 2 },
    reward: 'Streak shield if completed',
  },
  {
    title: 'Night Owl',
    description: 'Complete a session after 9pm',
    emoji: '🦉',
    requirement: { beforeHour: 24, minDuration: 15 },
    reward: 'Bonus pool share',
  },
  {
    title: 'Pomodoro Master',
    description: 'Complete a classic 25-min Pomodoro',
    emoji: '🍅',
    requirement: { minDuration: 25 },
    reward: 'Pool entry bonus',
  },
  {
    title: 'Speed Run',
    description: 'Complete 3 sessions of any length today',
    emoji: '🏃',
    requirement: { sessions: 3 },
    reward: 'Streak shield',
  },
];

export function getTodayChallenge(): DailyChallenge {
  // Deterministic daily rotation based on date
  const today = new Date().toDateString();
  const dayIndex = Math.floor(Date.now() / 86400000) % CHALLENGE_POOL.length;
  const template = CHALLENGE_POOL[dayIndex];

  return {
    ...template,
    id: `challenge-${today}`,
    completed: false,
    date: today,
  };
}

export async function checkChallengeCompletion(
  sessionDuration: number,
  stakeAmount: number,
  status: 'completed' | 'abandoned'
): Promise<boolean> {
  if (status !== 'completed') return false;

  const challenge = getTodayChallenge();
  const now = new Date();
  const req = challenge.requirement;

  // Check already completed today
  const saved = await AsyncStorage.getItem(`challenge-${challenge.date}`);
  if (saved === 'completed') return true;

  let met = true;
  if (req.minDuration && sessionDuration < req.minDuration) met = false;
  if (req.beforeHour && now.getHours() >= req.beforeHour) met = false;
  if (req.minStake && stakeAmount < req.minStake) met = false;

  if (req.sessions) {
    const raw = await AsyncStorage.getItem('focus_history');
    const history = raw ? JSON.parse(raw) : [];
    const todaySessions = history.filter((h: any) =>
      h.status === 'completed' &&
      new Date(h.completedAt).toDateString() === new Date().toDateString()
    ).length;
    if (todaySessions < req.sessions) met = false;
  }

  if (met) {
    await AsyncStorage.setItem(`challenge-${challenge.date}`, 'completed');
  }

  return met;
}