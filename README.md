# Fuel Tracker

An Expo SDK 54 iOS app for logging petrol fills by photographing (or importing a photo of) a bowser display. On-device OCR extracts the fill details, you add the odometer reading, and each save updates a cumulative Excel spreadsheet with efficiency formulas — per vehicle, for up to 4 vehicles.

## Features

**Effortless data entry**
- Photograph your bowser display, or import a photo if someone else filled up for you
- On-device OCR (Apple Vision) automatically reads price/litre, litres, total cost, and date — no manual typing
- Every field stays fully editable before saving, so a misread never locks in bad data

**Multi-vehicle tracking**
- Track up to 4 vehicles, each with its own registration and optional nickname
- Each vehicle keeps a completely separate fuel log and spreadsheet
- Quick switching between vehicles from the Vehicles tab

**Automatic fuel log spreadsheet**
- A cumulative Excel (`.xlsx`) file per vehicle, updated automatically on every save or delete
- Built-in formulas for km since last fill, km/L, L/100km, and cost per km
- Export via the share sheet, or print directly to any AirPrint printer

**History & insights**
- Full fill history per vehicle, filterable by last 30 days / 3 months / year
- Spend summary showing this month, this year, and all-time totals
- Efficiency trend chart tracking km/L or cost/km across recent fills

**Reminders**
- A local notification if you haven't logged a fill for a vehicle in 30 days
- A local notification if you haven't exported a vehicle's spreadsheet in 30 days

**Polish**
- Custom app icon, dark cohesive design, smooth animations and haptic feedback throughout
- Built-in Help screen with a step-by-step guide and quick tips

## Requirements

- Node.js 20+
- Xcode 16+ (for iOS builds)
- **Development build required** — OCR, camera, photo import, printing, and notifications all use native modules and do not run in Expo Go

## Setup

```bash
cd bowser-wonder
npm install
npx expo prebuild --platform ios
npx expo run:ios
```

For a device build:

```bash
npx expo run:ios --device
```

## Usage

1. In the **Vehicles** tab, add up to 4 vehicles by registration (and an optional nickname), and pick which one is active
2. On **Fill Up**, tap **Capture Bowser Display** to photograph the display — or use **Import their photo** if someone else filled up for you
3. OCR reads the price/L, litres, total, and date into the review screen; check the details, fix anything OCR missed, and enter your odometer reading
4. Tap **Save to spreadsheet** — the active vehicle's fuel log updates automatically
5. In **History**, filter by date range, check the spend summary and efficiency trend, and tap **Export XLSX** or **Print** to share the spreadsheet

Long-press a history entry to delete it (the spreadsheet is regenerated). Tap the **?** icon on the Fill Up screen for a full walkthrough and tips.

## Spreadsheet layout

| Column | Content |
|--------|---------|
| A | Date (dd-mmm-yyyy) |
| B | Price/L ($) |
| C | Litres |
| D | Total ($) |
| E | Odometer (km) |
| F | Km since last fill (formula) |
| G | km/L (formula) |
| H | L/100km (formula) |
| I | Cost/km ($) (formula) |

Each vehicle's file is stored in the app documents directory as `fuel_log_<REGISTRATION>.xlsx`.

## Tech stack

- Expo SDK 54 / React Native 0.81
- Expo Router (tabs)
- expo-camera / expo-image-picker (capture and import)
- expo-mlkit-ocr (Apple Vision on iOS, with a patched CoreImage preprocessing step)
- expo-print (native printing)
- expo-notifications (local reminders)
- expo-linear-gradient, react-native-svg, react-native-reanimated (UI polish)
- xlsx (spreadsheet generation with formulas)
- AsyncStorage (local record storage)

## OCR notes

Bowser displays vary by brand and country. The parser looks for common patterns (price/L, litres, total, dates) both on the same line as their label and split across adjacent lines, and copes with `$`/`¢` on either side of a number. Always review OCR results before saving — poor lighting, glare, or an unusual display layout may still require manual correction.
