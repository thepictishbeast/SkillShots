import { Tabs } from 'expo-router';
import { palette } from '@/theme/tokens';

// Bottom nav per ARCHITECTURE.md: Arena | Post | Vote | Wins | Profile.
// "Vote" tab routes into challenges in voting state — same backing controller.
export default function TabsLayout(): JSX.Element {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: palette.bg1, borderTopColor: palette.border },
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.text2,
        headerStyle: { backgroundColor: palette.bg0 },
        headerTintColor: palette.text0,
      }}
    >
      <Tabs.Screen name="arena" options={{ title: 'Arena' }} />
      <Tabs.Screen name="post" options={{ title: 'Post' }} />
      <Tabs.Screen name="vote" options={{ title: 'Vote' }} />
      <Tabs.Screen name="wins" options={{ title: 'My Wins' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
