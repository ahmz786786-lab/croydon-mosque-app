import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="announcements" />
      <Stack.Screen name="events" />
      <Stack.Screen name="janazah" />
      <Stack.Screen name="news" />
      <Stack.Screen name="prayer-times" />
      <Stack.Screen name="islamic-date" />
      <Stack.Screen name="monthly-calendar" />
    </Stack>
  );
}
