# TODO — Admin ↔ Profile / Booking Sync

- [ ] Update `frontend/AdminDashboard.html` to navigate to `Profile.html` and to refresh profile booking count after admin edits/cancels bookings.
- [ ] Update `frontend/Home.html` (booking confirm) so booking is saved in a shared format that `frontend/Profile.html` reads.
- [ ] Update `frontend/Profile.html` so it reads the exact booking format written by `frontend/Home.html` (seats/ids/fields) and refreshes automatically after booking changes.
- [ ] Add a lightweight shared storage key (e.g. `legend_shared_bookings_v1`) used by all pages.
- [ ] Manual test:
  - [ ] Login as user → create booking → verify it appears on Profile.
  - [ ] Login as admin → view bookings → edit/cancel → refresh Profile and verify changes.

