import type { Client } from "@libsql/client";
import { Hono } from "hono";
import { itemInput, itemPatch } from "../shared/schemas";
import type { Item } from "../shared/types";

async function findItem(database: Client, id: number): Promise<Item | null> {
  const result = await database.execute({
    sql: "SELECT id, title, description, status, rating FROM items WHERE id = ?",
    args: [id],
  });
  const row = result.rows[0];
  if (!row) return null;

  return {
    id: Number(row.id),
    title: String(row.title),
    description: String(row.description),
    status: row.status as Item["status"],
    rating: Number(row.rating),
  };
}

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function createApp(database: Client, databaseReady: Promise<void>) {
  const app = new Hono();

  app.get("/api/items", async (context) => {
    await databaseReady;
    const result = await database.execute(
      "SELECT id, title, description, status, rating FROM items ORDER BY id",
    );
    const items: Item[] = result.rows.map((row) => ({
      id: Number(row.id),
      title: String(row.title),
      description: String(row.description),
      status: row.status as Item["status"],
      rating: Number(row.rating),
    }));
    return context.json(items);
  });

  app.post("/api/items", async (context) => {
    await databaseReady;
    const body = await context.req.json().catch(() => null);
    const parsed = itemInput.safeParse(body);
    if (!parsed.success) {
      return context.json(
        { error: "Ungültige Eingabe", details: parsed.error.flatten() },
        400,
      );
    }

    const item = parsed.data;
    const result = await database.execute({
      sql: "INSERT INTO items (title, description, status, rating) VALUES (?, ?, ?, ?)",
      args: [item.title, item.description, item.status, item.rating],
    });
    const created: Item = { id: Number(result.lastInsertRowid), ...item };
    return context.json(created, 201);
  });

  app.patch("/api/items/:id", async (context) => {
    await databaseReady;
    const body = await context.req.json().catch(() => null);
    const parsed = itemPatch.safeParse(body);
    if (!parsed.success) {
      return context.json(
        { error: "Ungültige Eingabe", details: parsed.error.flatten() },
        400,
      );
    }

    const id = parseId(context.req.param("id"));
    if (id === null) return context.json({ error: "Eintrag nicht gefunden" }, 404);

    const patch = parsed.data;
    const result = await database.execute({
      sql: `UPDATE items
        SET title = COALESCE(?, title),
            description = COALESCE(?, description),
            status = COALESCE(?, status),
            rating = COALESCE(?, rating)
        WHERE id = ?`,
      args: [
        patch.title ?? null,
        patch.description ?? null,
        patch.status ?? null,
        patch.rating ?? null,
        id,
      ],
    });
    if (result.rowsAffected === 0) {
      return context.json({ error: "Eintrag nicht gefunden" }, 404);
    }

    const updated = await findItem(database, id);
    if (!updated) return context.json({ error: "Eintrag nicht gefunden" }, 404);
    return context.json(updated);
  });

  app.delete("/api/items/:id", async (context) => {
    await databaseReady;
    const id = parseId(context.req.param("id"));
    if (id === null) return context.json({ error: "Eintrag nicht gefunden" }, 404);

    const result = await database.execute({
      sql: "DELETE FROM items WHERE id = ?",
      args: [id],
    });
    if (result.rowsAffected === 0) {
      return context.json({ error: "Eintrag nicht gefunden" }, 404);
    }
    return context.body(null, 204);
  });

  return app;
}