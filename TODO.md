# TODO

- [x] Identify root cause: frequent PATCH updates during editor changes interrupt media playback.
- [x] Add debounced content saving in `frontend/app/(main)/(routes)/documents/[documentId]/page.tsx` to reduce re-renders/remounts.
- [x] Add cleanup on unmount (clear debounce timer) if needed.
- [ ] Consider also debouncing in other save paths (e.g., preview page) if playback still cuts off (if needed after content PATCH fix).
- [ ] Verify in browser: playing audio/video should not trigger repeated PATCH and should not restart/refresh.

