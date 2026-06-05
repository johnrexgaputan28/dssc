# Smart Academic Schedule and Notification System

This is a browser-based MVP for a school scheduling and notification platform. It supports three roles:

- Student: view section schedules, announcements, cancellations, and absence notices.
- Professor: create schedules, post announcements, and mark classes as cancelled or professor absent.
- Administrator: manage users, sections, and monitor system records.

## Demo Accounts

All demo accounts use the password `password123`.

- Student: `student@college.edu`
- Professor: `professor@college.edu`
- Admin: `admin@college.edu`

## How to Run

Serve the folder with a static web server, then open `index.html`.

Example:

```bash
py -m http.server 8000
```

Then open `http://localhost:8000/index.html`.

The MVP uses `localStorage` until Firebase is enabled.

## Firebase Setup

1. Create a Firebase project.
2. Add a Web app in Firebase Project settings.
3. Copy the Firebase config object into `firebase.js`.
4. Set `enabled: true` in `firebase.js`.
5. Enable Authentication > Sign-in method > Email/Password.
6. Add `localhost` in Authentication > Settings > Authorized domains for local testing.
7. Publish the rules in `database/firebase-rules.txt` to Firestore Rules.
8. New students and professors can create accounts from the login page.
9. Admin accounts should be created manually in Firebase Authentication and Firestore, or by a trusted existing admin.
10. Add initial `sections`, `schedules`, and `announcements` documents in Firestore.

Firebase's current web setup docs recommend the modular SDK for production, and also document browser module imports for quick static web apps. This project uses browser module imports from `www.gstatic.com` so it can stay plain HTML/CSS/JS.

## Main Features

- Role-based login and routing
- Student dashboard with section-based schedule display
- Professor dashboard with schedule creation and announcement posting
- Admin dashboard for user and section creation
- Calendar view
- Announcement feed
- Absence, cancellation, and room-change notification indicators

## Suggested Firebase Collections

See `database/firestore-structure.txt` for the initial Firestore model.
