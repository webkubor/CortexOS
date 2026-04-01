# PWA Reference

## Design Goals

- Offline behavior is intentional, not accidental
- Updates are visible and recoverable
- Installation is helpful, not intrusive
- The PWA layer matches the real app architecture

## Review Checklist

### Manifest
- App name, short name, theme color, background color, and display mode are coherent
- Icons include the sizes the app actually needs
- Maskable icons are included when installation quality matters

### Service Worker
- Registration is explicit
- Runtime caching is limited to safe targets
- Update behavior is understandable
- Stale code paths do not trap the user

### UX
- Install prompts are suppressed in standalone mode
- iOS gets manual guidance when needed
- Update prompts have a clear action and loading state

### Safety
- Avoid caching authenticated or highly volatile responses unless the user explicitly wants it
- Prefer simpler cache rules if the app has frequent releases or complex data freshness needs
