import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LoginDtoSchema } from '@skill-shots/shared-types';
import { api, ApiError } from '@/lib/api-client';
import { palette, space, radius, typo } from '@/theme/tokens';

export default function Login(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(): Promise<void> {
    setBusy(true);
    try {
      const parsed = LoginDtoSchema.safeParse({ email, password });
      if (!parsed.success) {
        Alert.alert('Check your details', parsed.error.issues[0]?.message ?? 'Invalid');
        return;
      }
      await api.login(parsed.data);
      router.replace('/(tabs)/arena');
    } catch (e) {
      // SECURITY: do not differentiate user-not-found from wrong-password — the
      // API returns a single `invalid_credentials` for both.
      const msg = e instanceof ApiError ? e.code : 'Login failed';
      Alert.alert('Could not log in', msg.replace(/_/g, ' '));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Welcome back</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={palette.text2}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholder="••••••••••••"
          placeholderTextColor={palette.text2}
        />
      </View>

      <Pressable
        style={[styles.btn, busy && { opacity: 0.5 }]}
        onPress={submit}
        disabled={busy}
      >
        <Text style={styles.btnText}>{busy ? 'Logging in…' : 'Log in'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg0, padding: space.xl, paddingTop: 80 },
  title: { ...typo.h1, color: palette.text0, marginBottom: space.xl },
  field: { marginBottom: space.l },
  label: { ...typo.caption, color: palette.text1, marginBottom: space.xs },
  input: {
    backgroundColor: palette.bg1,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: radius.m,
    paddingHorizontal: space.l,
    paddingVertical: space.m,
    color: palette.text0,
    ...typo.body,
  },
  btn: {
    backgroundColor: palette.accent,
    paddingVertical: space.l,
    borderRadius: radius.l,
    alignItems: 'center',
    marginTop: space.l,
  },
  btnText: { ...typo.title, color: palette.accentInk },
});
