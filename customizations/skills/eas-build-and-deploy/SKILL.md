---
name: eas-build-and-deploy
description: >-
  Build and deploy iOS and Android mobile apps to Expo Application Services (EAS). Use when the user requests mobile app builds, configuring eas.json, building APKs/AABs or IPAs, triggering cloud builds, or submitting to the Apple App Store and Google Play Store.
---

# EAS Build & Mobile Deployment Guide

Build production-ready native iOS and Android binaries in the cloud using Expo Application Services (EAS CLI) without requiring local macOS, Xcode, or Android Studio installations.

---

## 1. Prerequisites & Authentication
- `eas-cli` is installed globally (`which eas`).
- Set `EXPO_TOKEN` in the environment or run `eas login`.
- When running in automated scripts or non-interactive environments, always supply `--non-interactive`.

---

## 2. Configuring `eas.json`
Every EAS project requires an `eas.json` file at the root:

```json
{
  "cli": {
    "version": ">= 14.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

- **development**: Builds a custom Expo Go / Dev Client with native code for testing on physical devices.
- **preview**: Generates an APK for Android or Ad Hoc / TestFlight build for internal QA testing.
- **production**: Generates optimized App Store `.ipa` (iOS) and Google Play `.aab` (Android).

---

## 3. Triggering Cloud Builds (`eas build`)

### Run Non-Interactive Cloud Builds
```bash
# Build for both iOS and Android simultaneously
eas build --platform all --profile preview --non-interactive

# Build specifically for Android (produces APK/AAB)
eas build --platform android --profile preview --non-interactive

# Build production binaries for stores
eas build --platform all --profile production --non-interactive
```

### Local Testing Build (Android APK only)
To produce an installable `.apk` for direct sideloading or emulator testing without uploading to Google Play:
In `eas.json`:
```json
"preview": {
  "distribution": "internal",
  "android": {
    "buildType": "apk"
  }
}
```
Then run:
```bash
eas build --platform android --profile preview --non-interactive
```

---

## 4. Submitting to App Stores (`eas submit`)

Automatically upload store-ready production binaries directly from EAS:

### Submit to Apple App Store (TestFlight & Production)
```bash
eas submit --platform ios --non-interactive
```

### Submit to Google Play Console
```bash
eas submit --platform android --non-interactive
```

---

## 5. Checking Build Status & Logs
- List recent builds:
  ```bash
  eas build:list --limit 5
  ```
- View build details and download URL:
  ```bash
  eas build:view <BUILD_ID>
  ```
- Or query using the `expo` MCP server tools.
