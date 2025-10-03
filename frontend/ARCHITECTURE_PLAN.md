# Frontend Architecture Cleanup Plan

1. **Finalise Module Coverage**
   - Build missing `notes` and `todos` module controllers/index files in `js/modules/**`.
   - ✅ Port any remaining logic from the legacy orchestrator into the appropriate module layers (API/UI/controller).

2. **Retire Legacy Script**
   - Remove `frontend/app.js` once all features are modularised.
   - Update `index.html` to drop direct `<script>` tags for module internals; keep only shared core utilities, `moduleLoader`, and the modular `js/app.js` entrypoint.

3. **Module Loader Housekeeping**
   - ✅ Trim `moduleLoader` configs to point at the new module entry files only.
   - ✅ Ensure lazy-load triggers (navigation + interaction) cover every tab and avoid duplicate initialisation.

4. **Verification Pass**
   - Smoke-test each tab for navigation, data loading, and modal flows.
   - Run available frontend tests/linters; add lightweight regression scripts for navigation if missing.

5. **Docs & Follow-up**
   - Update `refactor-plan.md` (or supersede it) to reflect the complete modular architecture.
   - Communicate rollout steps for Docker/image rebuilds and confirm with deployment stakeholders before shipping.



