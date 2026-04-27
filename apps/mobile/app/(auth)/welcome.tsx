import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { palette, space, radius, typo } from '@/theme/tokens';

export default function Welcome(): JSX.Element {
  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>SKILL SHOTS</Text>
        <Text style={styles.title}>Real challenges.{'\n'}Real stakes.{'\n'}Public results.</Text>
        <Text style={styles.subtitle}>
          Post a challenge. Pay to enter. The community decides who took it best.
        </Text>
      </View>
      <View style={styles.actions}>
        <Link href="/(auth)/signup" asChild>
          <Pressable style={[styles.btn, styles.btnPrimary]}>
            <Text style={styles.btnPrimaryText}>Create account</Text>
          </Pressable>
        </Link>
        <Link href="/(auth)/login" asChild>
          <Pressable style={[styles.btn, styles.btnSecondary]}>
            <Text style={styles.btnSecondaryText}>I already have an account</Text>
          </Pressable>
        </Link>
        <Text style={styles.legal}>
          18+ only. Real money applies. By continuing you accept the Terms and Privacy Policy.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg0, padding: space.xl, justifyContent: 'space-between' },
  hero: { marginTop: 96 },
  eyebrow: { ...typo.caption, color: palette.accent, letterSpacing: 4, marginBottom: space.l },
  title: { ...typo.h0, color: palette.text0, marginBottom: space.l },
  subtitle: { ...typo.bodyLg, color: palette.text1 },
  actions: { gap: space.m, marginBottom: space.xl },
  btn: { paddingVertical: space.l, borderRadius: radius.l, alignItems: 'center' },
  btnPrimary: { backgroundColor: palette.accent },
  btnPrimaryText: { ...typo.title, color: palette.accentInk },
  btnSecondary: { backgroundColor: palette.bg2 },
  btnSecondaryText: { ...typo.title, color: palette.text0 },
  legal: { ...typo.caption, color: palette.text2, textAlign: 'center', marginTop: space.l },
});
