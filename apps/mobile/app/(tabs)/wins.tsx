import { View, Text, StyleSheet } from 'react-native';
import { palette, space, typo } from '@/theme/tokens';

export default function Wins(): JSX.Element {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>My Wins</Text>
      <Text style={styles.body}>
        Earnings, active challenges, battle history, and payout status will appear here once
        Phase 3 (wallet) ships.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg0, padding: space.xl, paddingTop: 80 },
  title: { ...typo.h1, color: palette.text0, marginBottom: space.l },
  body: { ...typo.body, color: palette.text1 },
});
