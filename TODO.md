# TODO - Frontend Zotion clone → Backend migration

- [x] Update `backend/notes/models.py` to add fields: icon, fullWidth, showToc, smallText (+ optional archived flag if needed).
- [ ] Create and apply migration(s).
- [ ] Update `backend/notes/serializers.py` to include the new fields.
- [ ] Add/extend backend endpoints to match frontend routes:
  - [ ] GET `/api/documents/:id/`
  - [ ] PATCH `/api/documents/:id/`
  - [ ] POST `/api/documents/:id/archive/`
  - [ ] (keep `/api/notes/...` working or alias it).
- [ ] Integrate auth/permissions so requests are authenticated.
- [ ] Update any frontend fetch calls if route names differ after backend changes.
- [ ] Run backend migrations and basic checks.

