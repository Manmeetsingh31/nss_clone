
# NSS Punjabi University — NSS Portal Frontend

A multi-page NSS portal frontend built with HTML5, CSS3 and vanilla JavaScript. The authentication and volunteer registration flows are connected to the Django REST backend.

## Run

Start the Django backend first at `http://127.0.0.1:8000`. For the frontend, serve this folder with a local static server (for example VS Code Live Server or `python -m http.server 5500`) rather than opening the HTML files with `file://`.

The frontend API base is configured in `js/api.js`.

## Authentication

Login now uses the Django REST API and JWT. Volunteer registration also submits to the backend. Do not use the old demo credentials from earlier versions.

## Important

This project intentionally contains **demo/placeholder information**. Before production use, replace all demo staff, contacts, statistics, notices, event details, achievements, images and official links with verified Punjabi University/NSS information.

## Structure

- HTML pages: home, about, administration, units, unit details, activities, events, event details, notices, gallery, achievements, volunteer, login, dashboard, certificates, contact, 404.
- `css/`: design system, page styles and responsive rules.
- `js/data.js`: centralized demo data.
- `js/main.js`: navigation, counters and shared UI.
- `js/search.js`: global search overlay.
- `js/forms.js`: frontend validation and localStorage submissions.
- `js/gallery.js`: filters and lightbox.
- `js/auth.js`: demo authentication.
- `js/language.js`: English/Punjabi UI switching.
- `images/`: local SVG placeholders, so the site has no broken image links.

## Current backend-connected flows

- Volunteer registration → `POST /api/volunteers/register/`
- College list → `GET /api/nss/colleges/`
- NSS unit list → `GET /api/nss/units/?college=<id>`
- Login → `POST /api/auth/login/`
- JWT access/refresh tokens are stored locally for the current browser session.

Other portal pages still contain demo content and will be connected to backend data in later stages.
