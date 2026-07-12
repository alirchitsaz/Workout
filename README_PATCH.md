# Chitsaz Training Lab arm-geometry patch

Replace your existing `biomechanics.js` with this one.
Replace your `index.html` with this one so it loads `visual-patch.js` after `app.js`.
Add `visual-patch.js` next to the other files.

This patch changes the model so:
- Track 8 is the lowest ARM MOUNT, around 36 inches / 3 feet, not floor level.
- The rigid metal arm extends from the track mount to the handle.
- The handle at the end of the arm is what lines up with your chest/hip/etc.
- Chest press, single-arm press, and fly use Track 8 with the arm angled up/out to the handle target.
- The visual track rail stops around 3 feet; the lower post is faded so the arm is never shown touching the floor.
