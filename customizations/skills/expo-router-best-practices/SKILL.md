---
name: expo-router-best-practices
description: >-
  Expo Router architecture and mobile navigation best practices. Use when building React Native navigation layouts, implementing file-based routing (Stack, Tabs, Modals), handling deep links, or structuring mobile screens in Expo.
---

# Expo Router Architecture & Navigation Guide

Expo Router brings universal, file-based routing to React Native and mobile applications, mirroring the structure and idioms of Next.js App Router.

---

## 1. Directory Structure

```text
app/
├── _layout.tsx         # Root Layout (Fonts, Auth Providers, Theme)
├── (tabs)/             # Tab navigation group
│   ├── _layout.tsx     # Tabs definition (<Tabs>)
│   ├── index.tsx       # Home tab screen
│   └── profile.tsx     # Profile tab screen
├── modal.tsx           # Modal screen
└── details/
    └── [id].tsx        # Dynamic route screen (/details/123)
```

---

## 2. Root Layout (`app/_layout.tsx`)

Wrap all screens with global providers, fonts, and safe area contexts:

```tsx
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="modal" 
          options={{ presentation: 'modal', headerShown: true, title: 'Details' }} 
        />
      </Stack>
    </SafeAreaProvider>
  );
}
```

---

## 3. Tab Navigation Layout (`app/(tabs)/_layout.tsx`)

```tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#0284c7' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

---

## 4. Navigation & Linking

### Imperative Navigation with `useRouter`
```tsx
import { useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';

export function NavigationButton() {
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push({ pathname: '/details/[id]', params: { id: '42' } })}>
      <Text>View Details</Text>
    </Pressable>
  );
}
```

### Declarative Navigation with `<Link>`
```tsx
import { Link } from 'expo-router';

<Link href="/modal" asChild>
  <Pressable><Text>Open Modal</Text></Pressable>
</Link>
```

---

## 5. Development with Tunneling
In remote or Docker environments, start the dev server with tunneling so physical phones can scan the QR code and connect:
```bash
npx expo start --tunnel
```
*(Clear cache with `npx expo start --tunnel -c` if Metro cache issues arise).*
