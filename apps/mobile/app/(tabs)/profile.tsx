import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api-client';
import { palette, space, radius, typo } from '@/theme/tokens';

export default function Profile(): JSX.Element {
  const router = useRouter();
  async function logout(): Promise<void> {
    await api.logout();
    router.replace('/(auth)/welcome');
  }
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.body}>
        Stats, badges, recent battles, and rankings will land here. For now, log out:
      </Text>
      <Pressable onPress={logout} style={styles.btn}>
        <Text style={styles.btnText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg0, padding: space.xl, paddingTop: 80 },
  title: { ...typo.h1, color: palette.text0, marginBottom: space.l },
  body: { ...typo.body, color: palette.text1, marginBottom: space.xl },
  btn: { backgroundColor: palette.bg2, padding: space.l, borderRadius: radius.l, alignItems: 'center' },
  btnText: { ...typo.title, color: palette.text0 },
});
