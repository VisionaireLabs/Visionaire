# OpenClaw Deck Themes

Beautiful, carefully crafted themes for OpenClaw Deck. Switch instantly with zero configuration.

## How to Use

1. Look for the **Theme** dropdown in the top bar (next to "+ New Agent")
2. Click and select your preferred theme
3. Theme applies instantly and persists across sessions

## Available Themes

### 🌙 Midnight (Default)
Deep dark blues with clean white text. Perfect for late-night coding sessions.
- **Vibe:** Classic, professional, easy on the eyes

### 🌊 Ocean Depths
Immersive deep blues and aqua accents. Like working underwater.
- **Vibe:** Calm, focused, oceanic

### 🌲 Forest Night
Rich forest greens with natural tones. Brings the outdoors in.
- **Vibe:** Natural, grounded, refreshing

### 🌅 Sunset Glow
Warm oranges and coral hues. Golden hour energy.
- **Vibe:** Warm, energetic, sunset vibes

### 🗿 Slate Gray
Sophisticated grays with subtle blue undertones. Professional and refined.
- **Vibe:** Clean, minimalist, corporate-friendly

### 💜 Purple Haze
Deep purples with magenta accents. Creative and mystical.
- **Vibe:** Creative, bold, artistic

### 🤖 Cyberpunk
Neon cyan and magenta on deep black. Full cyberpunk aesthetic.
- **Vibe:** Futuristic, high-tech, neon-soaked

### 🌹 Rose Garden
Elegant pinks and rose tones. Sophisticated and warm.
- **Vibe:** Elegant, sophisticated, romantic

## Technical Details

- **Instant switching:** Themes apply immediately via CSS variables
- **Persistent:** Your choice is saved in localStorage
- **Smooth transitions:** Color changes animate smoothly
- **Fully themeable:** Every UI element respects the theme
- **No performance impact:** Pure CSS, no JavaScript overhead

## Adding Your Own Theme

Edit `src/themes.ts` and add a new theme object to the `themes` record:

```typescript
myTheme: {
  id: 'myTheme',
  name: 'My Custom Theme',
  colors: {
    bg: '#your-background-color',
    // ... define all required colors
  }
}
```

All color properties are required for consistency.
