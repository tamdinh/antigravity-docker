---
name: eas-update
description: >-
  Deliver Over-The-Air (OTA) bug fixes and updates to Expo and React Native apps without submitting new binaries to the App Store or Google Play. Use when deploying instant mobile updates, configuring update channels, or rolling back updates.
---

# EAS Update (Over-The-Air Updates)

EAS Update allows you to push instant JavaScript and asset updates to end-user devices immediately, bypassing the days-long App Store and Google Play review cycles.

---

## 1. Setup & Requirements

### Installation
```bash
npx expo install expo-updates
```

### Configure `app.json`
```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/<YOUR-PROJECT-ID>",
      "checkAutomatically": "ON_LOAD",
      "fallbackToCacheTimeout": 0
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```
> **Important**: `runtimeVersion` dictates compatibility. Updates are only received by builds sharing the exact same `runtimeVersion`. Changes to native code require a full `eas build`.

---

## 2. Publishing an Update (`eas update`)

### Push Update to Production Branch
```bash
eas update --branch production --message "Fix payment screen layout" --non-interactive
```

### Push Update to Preview Branch (for QA)
```bash
eas update --branch preview --message "QA test build" --non-interactive
```

---

## 3. Channel Mapping & Management
Channels point to branches. For example, the `production` channel receives updates published to the `production` branch:
- Link channel to branch:
  ```bash
  eas channel:edit production --branch production
  ```
- View channel status:
  ```bash
  eas channel:view production
  ```

---

## 4. Emergency Rollback
If an update introduces a bug, revert instantly by re-publishing a previous known-good update:
```bash
# List recent updates on the branch
eas update:list --branch production --limit 5

# Re-publish a specific known good update group
eas update:re-publish --group <UPDATE_GROUP_ID>
```
All connected user devices will revert on their next app launch.
