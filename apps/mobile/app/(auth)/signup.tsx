import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SignupDtoSchema } from '@skill-shots/shared-types';
import { api, ApiError } from '@/lib/api-client';
import { palette, space, radius, typo } from '@/theme/tokens';

export default function Signup(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [dateOfBirth, setDob] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(): Promise<void> {
    setBusy(true);
    try {
      const parsed = SignupDtoSchema.safeParse({
        email,
        username,
        password,
        dateOfBirth,
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        Alert.alert('Check your details', first?.message ?? 'Invalid input');
        return;
      }
      await api.signup(parsed.data);
      router.replace('/(tabs)/arena');
    } catch (e) {
      const msg = e instanceof ApiError ? e.code : 'Sign up failed';
      Alert.alert('Could not sign up', msg.replace(/_/g, ' '));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Create account</Text>

      <Field label="Email">
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={palette.text2}
        />
      </Field>

      <Field label="Username (3–24, letters/digits/_)">
        <TextInput
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          style={styles.input}
          placeholder="yourhandle"
          placeholderTextColor={palette.text2}
        />
      </Field>

      <Field label="Password (12+ chars, mix of cases + a digit)">
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholder="••••••••••••"
          placeholderTextColor={palette.text2}
        />
      </Field>

      <Field label="Date of birth (YYYY-MM-DD) — 18+ required">
        <TextInput
          value={dateOfBirth}
          onChangeText={setDob}
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
          style={styles.input}
          placeholder="1990-01-01"
          placeholderTextColor={palette.text2}
        />
      </Field>

      <Pressable
        style={[styles.btn, busy && { opacity: 0.5 }]}
        onPress={submit}
        disabled={busy}
        accessibilityRole="button"
      >
        <Text style={styles.btnText}>{busy ? 'Creating…' : 'Create account'}</Text>
      </Pressable>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
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
