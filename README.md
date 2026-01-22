# Radyong Sira! Radio Player
A simple player that works with the azuracast api

## Configuration

Just change this with your azuracast station now playing api:

```javascript
const boxplay = "https://radio.ltg.network/api/nowplaying_static/radyongsira.json";
```

Change the stream link in your HTML file to match your station.

## Project Structure

```
radyongsira/
  css/
    boxplayer.css      - Main stylesheet for player UI
  js/
    api.js             - Core player logic, polling, event handlers
  embed/
    charts.html        - OnlineRadioBox top charts widget
    schedule.html      - OnlineRadioBox schedule widget
  index.html           - Main player page
  charts.html          - Charts page (embeds top charts)
  schedule.html        - Schedule page (embeds schedule)
  navbar.html          - Reusable responsive navigation component
  site.webmanifest     - PWA manifest
  LICENSE              - Project license
```

## Memory Optimizations

This project includes several memory optimizations to ensure efficient operation on long-running streaming players:

### 1. **Event Listener Management**
   - **Single-use listeners**: Image load events use `{ once: true }` to auto-remove after firing
   - **Named handler functions**: All event listeners are named functions (not anonymous) for easy cleanup
   - **Proper cleanup on unload**: `beforeunload` and `unload` handlers remove all listeners on page navigation
   - Files: [js/api.js](js/api.js#L65-L72), [navbar.html](navbar.html#L60-L82)

### 2. **Polling Robustness**
   - **Exponential backoff**: Failed API requests backoff from 500ms to 2000ms to reduce thrashing
   - **Automatic retry reset**: Retry counter resets on successful fetch
   - **5-second timeout**: Fetch requests abort after 5 seconds to prevent hung connections
   - **Promise.finally()**: Ensures polling continues even on errors
   - File: [js/api.js](js/api.js#L126-L225)

### 3. **Image & Resource Optimization**
   - **Preload pattern**: Images load via temporary `Image()` objects before assignment to prevent URL abort chains
   - **Cache checking**: `dataset._lastSrc` tracks last-assigned URL to avoid redundant reassignments
   - **CORS handling**: Uses wsrv.nl proxy for external images to bypass CORS/OpaqueResponseBlocking
   - **CORS metadata preload**: Audio element configured with `crossOrigin='anonymous'` and `preload='metadata'`
   - File: [js/api.js](js/api.js#L10-20, L77-78)

### 4. **DOM & Resize Handling**
   - **Debounced resize**: Window resize listener debounced (150ms) to avoid excessive calculations
   - **Named resize handler**: `handleResize()` is a named function for cleanup on page unload
   - **Null checks before DOM access**: All DOM element references validated before use
   - File: [js/api.js](js/api.js#L49-65)

### 5. **Navigation Event Cleanup**
   - **Menu listener cleanup**: Navbar toggles and event handlers removed on unload
   - **Keyboard handler cleanup**: Escape key and click handlers properly removed
   - **Resize observer cleanup**: Responsive menu resize listener removed
   - File: [navbar.html](navbar.html#L66-82)

### 6. **Project Organization**
   - **Removed root duplicates**: Old `api.js` and `boxplayer.css` from root deleted to reduce bloat
   - **Separated concerns**: CSS and JS split into `css/` and `js/` subdirectories for clarity
   - **Third-party embeds**: OnlineRadioBox widgets in `embed/` folder (external, memory-managed by vendor)

## Performance Characteristics

- **Real-time polling**: 500ms base interval with exponential backoff on errors
- **Memory baseline**: ~2-5MB for player + polling loop (including jQuery 3.7.1)
- **No leaks on**: Page navigation, repeated polling cycles, image updates, window resize
- **Browser compatibility**: Modern browsers (Chrome, Firefox, Safari, Edge)

## Dependencies

- **jQuery 3.7.1** - DOM manipulation and AJAX
- **FontAwesome 6** - Icons (included via CDN)
- **Color Thief** - Dominant color extraction for accent colors (included via CDN)
- **Modern browser APIs**:
  - MediaSession API for system media controls
  - Audio API with CORS support
  - LocalStorage for user preferences

## Testing Memory Performance

To verify memory optimizations:

1. **Open DevTools**: F12 → Memory tab
2. **Take heap snapshot**: Before and after page navigation
3. **Check for growth**: Memory should return to baseline after cleanup
4. **Monitor listeners**: Use DevTools → Event Listeners tab to verify cleanup

## Notes

- All event listeners are properly removed on page unload
- Image preloading prevents abort chains that would accumulate event listeners
- Polling continues indefinitely but uses minimal resources with exponential backoff
- Third-party embeds (OnlineRadioBox) are memory-managed separately

