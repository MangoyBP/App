# Project guide

## Stack and structure

- `src/client` contains the Preact user interface and its styles.
- `src/server` contains the Hono API and SQLite database setup.
- `src/shared` contains types shared between frontend and backend.
- `data/seed.json` provides the initial demo records. The server imports them into `data/items.db` on first start.
- Vite serves the frontend on port 5173 and proxies `/api` requests to the Hono server on port 3000.

## Commands

- Run `npm install` once to install dependencies.
- Run `npm run dev` to start the frontend and API together.
- Run `npm run typecheck` or `npm run build` to validate changes.

## Git collaboration

- Fetch or pull `origin` before starting work.
- Give each tool its own branch and do not let tools edit the same file at the same time.
- Review changes before committing; push work on its branch and use a pull request to merge it.
- Never commit passwords, API keys, personal data, or `.env` files.