import { View, Text, StyleSheet } from 'react-native';
import { palette, space, typo } from '@/theme/tokens';

export default function VoteHome(): JSX.Element {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Vote</Text>
      <Text style={styles.body}>
        Browse challenges in their voting window. Live counts are hidden until voting closes —
        that keeps the bandwagon out.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg0, padding: space.xl, paddingTop: 80 },
  title: { ...typo.h1, color: palette.text0, marginBottom: space.l },
  body: { ...typo.body, color: palette.text1 },
});
