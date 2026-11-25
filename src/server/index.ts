import { serve } from "@hono/node-server";
import { createClient } from "@libsql/client";
import { readFile } from "node:fs/promises";
import { createApp } from "./app";
import type { Item } from "../shared/types";

const database = createClient({
  url: process.env.DATABASE_URL ?? "file:data/items.db",
});
async function initializeDatabase() {
  await database.execute(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 3 CHECK (rating BETWEEN 1 AND 5)
    )
  `);

  const columns = await database.execute("PRAGMA table_info(items)");
  if (!columns.rows.some((row) => row.name === "rating")) {
    await database.execute(
      "ALTER TABLE items ADD COLUMN rating INTEGER NOT NULL DEFAULT 3 CHECK (rating BETWEEN 1 AND 5)",
    );
  }

  const result = await database.execute("SELECT COUNT(*) AS total FROM items");
  if (Number(result.rows[0]?.total ?? 0) > 0) return;

  const seed = JSON.parse(
    await readFile(new URL("../../data/seed.json", import.meta.url), "utf8"),
  ) as Item[];

  for (const item of seed) {
    await database.execute({
      sql: "INSERT INTO items (id, title, description, status, rating) VALUES (?, ?, ?, ?, ?)",
      args: [item.id, item.title, item.description, item.status, item.rating],
    });
  }
}

const databaseReady = initializeDatabase();
const app = createApp(database, databaseReady);

serve({
  fetch: app.fetch,
  hostname: "0.0.0.0",
  port: Number(process.env.PORT ?? 3000),
});

console.log("API listening on http://localhost:3000");