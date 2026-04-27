import { View, Text, StyleSheet } from 'react-native';
import { palette, space, typo } from '@/theme/tokens';

// Post-flow scaffold — full 3-step flow ships with Phase 1 final.
export default function Post(): JSX.Element {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Post a challenge</Text>
      <Text style={styles.body}>The 3-step create flow lands here:</Text>
      <Text style={styles.step}>1. Title, category, rules</Text>
      <Text style={styles.step}>2. Pot amount + entry fee</Text>
      <Text style={styles.step}>3. Upload your proof video → publish</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg0, padding: space.xl, paddingTop: 80 },
  title: { ...typo.h1, color: palette.text0, marginBottom: space.l },
  body: { ...typo.body, color: palette.text1, marginBottom: space.l },
  step: { ...typo.bodyLg, color: palette.text0, marginBottom: space.s },
});
