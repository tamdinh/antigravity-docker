---
name: expo-troubleshooting
description: >-
  Diagnose and resolve Expo and EAS build failures, Metro bundler issues, native module linking errors, config plugin problems, and credentials signing issues. Use when an Expo or React Native mobile build fails or crashes.
---

# Expo & EAS Troubleshooting Guide

Step-by-step diagnostic workflows for resolving mobile development and cloud build issues with Expo and EAS.

---

## 1. Diagnosing EAS Cloud Build Failures

### Symptom: `eas build` fails on iOS or Android
**Diagnostic Steps:**
1. Retrieve the detailed build log URL from the terminal output or run:
   ```bash
   eas build:view <BUILD-ID>
   ```
2. **Common Root Causes & Fixes:**
   - **Missing Config Plugins**: Third-party libraries with native code (e.g. `@react-native-firebase`, `react-native-camera`, `expo-location`) must be declared in the `plugins` array of `app.json`:
     ```json
     {
       "expo": {
         "plugins": [
           ["expo-location", { "locationAlwaysAndWhenInUsePermission": "Allow app to access location." }]
         ]
       }
     }
     ```
     Run `npx expo prebuild --clean` locally to test native generation without error.
   - **Mismatched Package Versions**:
     Fix automatically using Expo's dependency alignment tool:
     ```bash
     npx expo install --fix
     ```
   - **Missing iOS Info.plist Permission Strings**: Apple rejects builds if permission descriptions are missing.
     Ensure `ios.infoPlist` in `app.json` has:
     - `NSCameraUsageDescription`
     - `NSPhotoLibraryUsageDescription`
     - `NSLocationWhenInUseUsageDescription`

---

## 2. Resolving Metro Bundler & Development Server Issues

### Symptom: Stale cache, syntax errors, or bundling hangs
1. Clear Metro and watchman caches completely:
   ```bash
   npx expo start -c --tunnel
   ```
2. Check for port conflicts:
   Ensure port `8081` is not blocked or specify custom port:
   ```bash
   npx expo start --port 8082 --tunnel
   ```

---

## 3. Signing Credentials & Keystores

### Manage iOS Certificates & Android Keystores
EAS handles certificates securely on the cloud:
- Inspect credentials:
  ```bash
  eas credentials
  ```
- Reset or re-generate keystores/provisioning profiles:
  ```bash
  eas credentials --platform android
  eas credentials --platform ios
  ```
- Never commit private keystores or `.p8` / `.mobileprovision` files into Git.

---

## 4. Native Dependency Doctor
Run Expo's built-in health check to automatically detect and repair project configuration issues:
```bash
npx expo-doctor
```
This inspects:
- Deprecated packages
- Duplicate dependencies
- Node & npm version compatibility
- `app.json` schema validation
