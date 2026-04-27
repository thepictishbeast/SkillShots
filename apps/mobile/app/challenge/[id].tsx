import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import type { Challenge } from '@skill-shots/shared-types';
import { api, ApiError } from '@/lib/api-client';
import { palette, space, radius, typo } from '@/theme/tokens';
import { formatCents, formatTimeLeft } from '@/lib/format';

export default function ChallengeDetail(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const c = await api.getChallenge(String(id));
        setChallenge(c);
      } catch (e) {
        setError(e instanceof ApiError ? e.code : 'load_failed');
      }
    }
    void load();
  }, [id]);

  if (error) {
    return (
      <View style={styles.root}>
        <Text style={styles.error}>Could not load challenge: {error.replace(/_/g, ' ')}</Text>
      </View>
    );
  }
  if (!challenge) {
    return (
      <View style={styles.root}>
        <Text style={styles.body}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: space.l }}>
      <Video
        source={{ uri: challenge.proofVideoUrl }}
        style={styles.video}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
      />
      <Text style={styles.category}>{challenge.category.toUpperCase()}</Text>
      <Text style={styles.title}>{challenge.title}</Text>
      <View style={styles.statsRow}>
        <Stat label="Entry" value={formatCents(challenge.entryFee)} />
        <Stat label="Pot" value={formatCents(challenge.totalPot)} accent />
        <Stat label="Time left" value={formatTimeLeft(challenge.entryDeadline)} />
      </View>
      <Text style={styles.sectionTitle}>Rules</Text>
      <Text style={styles.body}>{challenge.rules}</Text>
      <Text style={styles.judgingNote}>
        Winners are selected by community vote based on how well each entry follows these rules.
      </Text>
    </ScrollView>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }): JSX.Element {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && { color: palette.accent }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg0 },
  video: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', borderRadius: radius.m, marginBottom: space.l },
  category: { ...typo.caption, color: palette.accent, letterSpacing: 2 },
  title: { ...typo.h1, color: palette.text0, marginBottom: space.l },
  statsRow: { flexDirection: 'row', gap: space.l, marginBottom: space.xl },
  statLabel: { ...typo.caption, color: palette.text2 },
  statValue: { ...typo.bodyLg, color: palette.text0, fontWeight: '700' },
  sectionTitle: { ...typo.title, color: palette.text0, marginBottom: space.s },
  body: { ...typo.body, color: palette.text1, marginBottom: space.l },
  judgingNote: {
    ...typo.caption,
    color: palette.text2,
    fontStyle: 'italic',
    marginTop: space.l,
    padding: space.m,
    borderRadius: radius.m,
    backgroundColor: palette.bg1,
  },
  error: { ...typo.body, color: palette.negative, padding: space.l },
});
