import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, Dimensions, ScrollView, Alert, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { scheduleSessionReminder } from '../services/NotificationService';
import * as Notifications from 'expo-notifications';

const { height } = Dimensions.get('window');

interface ScheduledSession {
  id: string;
  taskNote: string;
  duration: number;
  scheduledFor: string; // ISO string
  notificationId: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

const DURATIONS = [
  { mins: 15, label: '15m', sub: 'Power Block' },
  { mins: 25, label: '25m', sub: 'Pomodoro' },
  { mins: 50, label: '50m', sub: 'Deep Work' },
  { mins: 90, label: '90m', sub: 'Flow State' },
];

const QUICK_TIMES = [
  { label: 'In 1 hour', offsetMins: 60 },
  { label: 'In 2 hours', offsetMins: 120 },
  { label: 'Tonight 8pm', hour: 20, minute: 0 },
  { label: 'Tomorrow 9am', hour: 9, minute: 0, tomorrow: true },
  { label: 'Tomorrow noon', hour: 12, minute: 0, tomorrow: true },
  { label: 'Tomorrow 6pm', hour: 18, minute: 0, tomorrow: true },
];

function getScheduledDate(option: typeof QUICK_TIMES[0]): Date {
  const now = new Date();
  if (option.offsetMins) {
    return new Date(now.getTime() + option.offsetMins * 60 * 1000);
  }
  const d = new Date();
  if (option.tomorrow) d.setDate(d.getDate() + 1);
  d.setHours(option.hour ?? 9, option.minute ?? 0, 0, 0);
  // If the time has already passed today, push to tomorrow
  if (d <= now && !option.tomorrow) d.setDate(d.getDate() + 1);
  return d;
}

function formatScheduledTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isTomorrow = d.toDateString() === new Date(now.getTime() + 86400000).toDateString();

  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today at ${time}`;
  if (isTomorrow) return `Tomorrow at ${time}`;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ` at ${time}`;
}

export default function SessionSchedulingModal({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const c = colors;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [duration, setDuration] = useState(25);
  const [selectedTime, setSelectedTime] = useState<typeof QUICK_TIMES[0] | null>(null);
  const [scheduled, setScheduled] = useState<ScheduledSession[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      loadScheduled();
      Animated.spring(slideAnim, {
        toValue: 0, tension: 65, friction: 11, useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height, duration: 300, useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const loadScheduled = async () => {
    try {
      const data = await AsyncStorage.getItem('scheduled_sessions');
      if (data) {
        const sessions: ScheduledSession[] = JSON.parse(data);
        // Filter out past sessions
        const upcoming = sessions.filter(s => new Date(s.scheduledFor) > new Date());
        setScheduled(upcoming);
        if (upcoming.length !== sessions.length) {
          await AsyncStorage.setItem('scheduled_sessions', JSON.stringify(upcoming));
        }
      }
    } catch {}
  };

  const handleSchedule = async () => {
    if (!selectedTime) return Alert.alert('Pick a time', 'Select when you want to focus.');

    setSaving(true);
    try {
      const date = getScheduledDate(selectedTime);
      const taskLabel = `${duration}-minute focus session`;

      await scheduleSessionReminder(date, taskLabel);

      const newSession: ScheduledSession = {
        id: `${date.getTime()}`,
        taskNote: taskLabel,
        duration,
        scheduledFor: date.toISOString(),
        notificationId: `session-${date.getTime()}`,
      };

      const existing = await AsyncStorage.getItem('scheduled_sessions');
      const sessions = existing ? JSON.parse(existing) : [];
      sessions.push(newSession);
      await AsyncStorage.setItem('scheduled_sessions', JSON.stringify(sessions));

      setScheduled(prev => [...prev, newSession]);
      setSelectedTime(null);

      Alert.alert(
        '⏰ Session scheduled',
        `You'll be reminded ${formatScheduledTime(newSession.scheduledFor).toLowerCase()}.`,
        [{ text: 'Got it', style: 'default' }]
      );
    } catch (err: any) {
      Alert.alert('Error', `Could not schedule: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (session: ScheduledSession) => {
    try {
      
      await Notifications.cancelScheduledNotificationAsync(session.notificationId);
    } catch {}
    const updated = scheduled.filter(s => s.id !== session.id);
    setScheduled(updated);
    await AsyncStorage.setItem('scheduled_sessions', JSON.stringify(updated));
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[
        styles.sheet,
        { backgroundColor: c.sheetBg, borderColor: `${c.accent}22` },
        { transform: [{ translateY: slideAnim }] },
      ]}>
        <View style={[styles.handle, { backgroundColor: `${c.accent}33` }]} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: c.text }]}>Schedule a Session</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]}>
            Pre-commit to focusing. We'll remind you when it's time.
          </Text>

          {/* Upcoming scheduled sessions */}
          {scheduled.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: c.textMuted }]}>UPCOMING</Text>
              {scheduled.map(session => (
                <View key={session.id} style={[styles.scheduledItem, {
                  backgroundColor: `${c.accent}0a`,
                  borderColor: `${c.accent}22`,
                }]}>
                  <View style={styles.scheduledLeft}>
                    <Text style={styles.scheduledEmoji}>⏰</Text>
                    <View>
                      <Text style={[styles.scheduledTime, { color: c.accent }]}>
                        {formatScheduledTime(session.scheduledFor)}
                      </Text>
                      <Text style={[styles.scheduledDesc, { color: c.textMuted }]}>
                        {session.duration} min session
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleCancel(session)}>
                    <Text style={[styles.cancelText, { color: '#f87171' }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Duration picker */}
          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>DURATION</Text>
          <View style={styles.durationRow}>
            {DURATIONS.map(d => (
              <TouchableOpacity
                key={d.mins}
                onPress={() => setDuration(d.mins)}
                style={[
                  styles.durationBtn,
                  { borderColor: c.cardBorder, backgroundColor: c.card },
                  duration === d.mins && { borderColor: c.accent, backgroundColor: `${c.accent}15` },
                ]}
              >
                <Text style={[styles.durationLabel, { color: c.textSub }, duration === d.mins && { color: c.accent }]}>
                  {d.label}
                </Text>
                <Text style={[styles.durationSub, { color: c.textMuted }]}>{d.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Time picker */}
          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>WHEN</Text>
          <View style={styles.timeGrid}>
            {QUICK_TIMES.map((option, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setSelectedTime(option)}
                style={[
                  styles.timeBtn,
                  { borderColor: c.cardBorder, backgroundColor: c.card },
                  selectedTime === option && { borderColor: c.accent, backgroundColor: `${c.accent}15` },
                ]}
              >
                <Text style={[
                  styles.timeBtnText,
                  { color: c.textSub },
                  selectedTime === option && { color: c.accent },
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Confirm button */}
          <LinearGradient
            colors={selectedTime ? ['#2a7a5e', '#4dd9ac'] : ['#1a3a2e', '#1a3a2e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.scheduleBtn, !selectedTime && { opacity: 0.4 }]}
          >
            <TouchableOpacity
              onPress={handleSchedule}
              disabled={!selectedTime || saving}
              style={styles.scheduleBtnInner}
            >
              <Text style={styles.scheduleBtnText}>
                {saving ? 'Scheduling...' : selectedTime
                  ? `Schedule ${duration}m · ${selectedTime.label}`
                  : 'Select a time above'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>

          <Text style={[styles.footer, { color: c.textMuted }]}>
            You'll receive a push notification at the scheduled time.
          </Text>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 48,
    borderTopWidth: 1, maxHeight: height * 0.88,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  subtitle: { fontSize: 13, lineHeight: 18, marginBottom: 28 },

  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 10, letterSpacing: 2, marginBottom: 12 },

  scheduledItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 8,
  },
  scheduledLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  scheduledEmoji: { fontSize: 20 },
  scheduledTime: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  scheduledDesc: { fontSize: 12 },
  cancelText: { fontSize: 13 },

  durationRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  durationBtn: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  durationLabel: { fontSize: 16, fontWeight: '500' },
  durationSub: { fontSize: 10, marginTop: 2 },

  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
  timeBtn: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, minWidth: '30%',
  },
  timeBtnText: { fontSize: 13, textAlign: 'center' },

  scheduleBtn: { borderRadius: 16, marginBottom: 16 },
  scheduleBtnInner: { padding: 18, alignItems: 'center' },
  scheduleBtnText: { color: '#060d12', fontSize: 15, fontWeight: '700' },

  footer: { fontSize: 11, textAlign: 'center' },
});