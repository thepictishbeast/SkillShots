import { useEffect, useState } from 'react';
import { FlatList, View, Text, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import type { Challenge } from '@skill-shots/shared-types';
import { api } from '@/lib/api-client';
import { palette, space, radius, typo, shadow } from '@/theme/tokens';
import { formatCents, formatTimeLeft } from '@/lib/format';

export default function Arena(): JSX.Element {
  const router = useRouter();
  const [items, setItems] = useState<Challenge[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    try {
      setError(null);
      const r = await api.listChallenges();
      setItems(r.items);
    } catch {
      setError('Could not load the Arena. Pull to refresh.');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onRefresh(): Promise<void> {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (items === null && !error) {
    return (
      <View style={styles.root}>
        <Text style={styles.empty}>Loading…</Text>
      </View>
    );
  }

  if (items !== null && items.length === 0) {
    return (
      <View style={styles.root}>
        <Text style={styles.emptyTitle}>The Arena is quiet</Text>
        <Text style={styles.empty}>
          No live challenges right now. Tap Post to start one.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.list}
      data={items ?? []}
      keyExtractor={(c) => c.id}
      refreshControl={<RefreshControl tintColor={palette.text0} refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        error ? <Text style={styles.error}>{error}</Text> : null
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/challenge/${item.id}`)}
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.category}>{item.category.toUpperCase()}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.row}>
            <Stat label="Entry" value={formatCents(item.entryFee)} />
            <Stat label="Pot" value={formatCents(item.totalPot)} accent />
            <Stat label="Time left" value={formatTimeLeft(item.entryDeadline)} />
          </View>
        </Pressable>
      )}
    />
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
  list: { padding: space.l },
  emptyTitle: { ...typo.h1, color: palette.text0, padding: space.xl, textAlign: 'center', marginTop: 80 },
  empty: { ...typo.body, color: palette.text2, paddingHorizontal: space.xl, textAlign: 'center' },
  error: { ...typo.body, color: palette.negative, padding: space.l },
  card: {
    backgroundColor: palette.bg1,
    borderRadius: radius.l,
    padding: space.l,
    marginBottom: space.m,
    borderColor: palette.border,
    borderWidth: 1,
    ...shadow.card,
  },
  category: { ...typo.caption, color: palette.accent, letterSpacing: 2, marginBottom: space.xs },
  title: { ...typo.title, color: palette.text0, marginBottom: space.m },
  row: { flexDirection: 'row', gap: space.l },
  statLabel: { ...typo.caption, color: palette.text2 },
  statValue: { ...typo.bodyLg, color: palette.text0, fontWeight: '700' },
});
