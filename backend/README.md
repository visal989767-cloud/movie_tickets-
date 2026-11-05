# Cinema Backend

This folder contains the Node.js backend for the Cinema project. It serves the static frontend from the `../frontend` directory and exposes the API under `/api/*`.

Quick start (development)

```bash
cd backend
npm install
npm run dev
```

Start in production mode

```bash
cd backend
npm install --production
npm start
```

Notes

- The server already serves files from the repository `frontend` directory — no separate frontend build is required for plain HTML/CSS/JS pages.
- If you later adopt a frontend toolchain (React/Vite/webpack), add a proper `build` script that outputs files to `../frontend` or `backend/public`.
- A `Procfile` is included for simple Heroku-style deployments.
