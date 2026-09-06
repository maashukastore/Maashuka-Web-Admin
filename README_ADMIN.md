Maashuka Admin Panel (scaffold)

What I added:

- An `app/admin` area with routes: dashboard, products, orders, customers, users, roles, permissions, settings, login.
- `app/admin/layout.js` with `Sidebar` and `Header` components.
- `lib/permissions.js` with a simple role-permission model and `hasPermission` helper.
- `middleware.js` that redirects unauthenticated visits to `/admin/login` (development stub using `role` cookie).

Notes:
- The login page is a development stub that writes a `role` cookie; replace it with real authentication.
- `lib/permissions.js` should be integrated with your user store and real auth tokens before production.

Next steps you may want me to do:
- Hook up actual auth (JWT/session) and role assignment.
- Implement CRUD pages for products, orders, and users.
- Add UI polish and reuseable components.
