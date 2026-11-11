import { serve } from "@hono/node-server";
import { createClient } from "@libsql/client";
import { Hono } from "hono";
import { readFile } from "node:fs/promises";
import type { Item } from "../shared/types";

const database = createClient({
  url: process.env.DATABASE_URL ?? "file:data/items.db",
});
const app = new Hono();

async function initializeDatabase() {
  await database.execute(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL
    )
  `);

  const result = await database.execute("SELECT COUNT(*) AS total FROM items");
  if (Number(result.rows[0]?.total ?? 0) > 0) return;

  const seed = JSON.parse(
    await readFile(new URL("../../data/seed.json", import.meta.url), "utf8"),
  ) as Item[];

  for (const item of seed) {
    await database.execute({
      sql: "INSERT INTO items (id, title, description, status) VALUES (?, ?, ?, ?)",
      args: [item.id, item.title, item.description, item.status],
    });
  }
}

const databaseReady = initializeDatabase();

app.get("/api/items", async (context) => {
  await databaseReady;
  const result = await database.execute(
    "SELECT id, title, description, status FROM items ORDER BY id",
  );
  const items: Item[] = result.rows.map((row) => ({
    id: Number(row.id),
    title: String(row.title),
    description: String(row.description),
    status: row.status as Item["status"],
  }));
  return context.json(items);
});

serve({
  fetch: app.fetch,
  hostname: "0.0.0.0",
  port: Number(process.env.PORT ?? 3000),
});

console.log("API listening on http://localhost:3000");