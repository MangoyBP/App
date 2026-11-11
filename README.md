# IT31 Demo

Fullstack starter with a Preact/Vite frontend, Hono API, and local SQLite database.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:5173 for the app. The JSON API is available at http://localhost:3000/api/items. On its first start, the API creates `data/items.db` and imports the records from `data/seed.json`.

## Checks

```sh
npm run typecheck
npm run build
```