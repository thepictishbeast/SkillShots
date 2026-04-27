import { Redirect } from 'expo-router';

// First-boot routing decision lives here.
// TODO Phase-1.5: read SecureStore for an existing session token; redirect
// to (tabs) if valid, otherwise (auth)/welcome.
export default function Index(): JSX.Element {
  return <Redirect href="/(auth)/welcome" />;
}
