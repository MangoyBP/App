import type { Item } from "../shared/types";

export interface Task {
  id: number;
  title: string;
  category: string;
  note: string;
  done: boolean;
}

interface TaskDetails {
  format: "it31-task-v1";
  category: string;
  note: string;
}

interface ApiError {
  error?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new Error("Die API ist gerade nicht erreichbar. Bitte prüfe, ob der Server läuft.");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(body?.error ?? `Die Anfrage ist fehlgeschlagen (${response.status}).`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function decodeDetails(description: string) {
  try {
    const value = JSON.parse(description) as Partial<TaskDetails>;
    if (
      value.format === "it31-task-v1" &&
      typeof value.category === "string" &&
      typeof value.note === "string"
    ) {
      return { category: value.category, note: value.note };
    }
  } catch {
    // Older entries use description as their note.
  }
  return { category: "Allgemein", note: description };
}

function toTask(item: Item): Task {
  const details = decodeDetails(item.description);
  return {
    id: item.id,
    title: item.title,
    category: details.category,
    note: details.note,
    done: item.status === "Erledigt",
  };
}

function encodeDetails(category: string, note: string): string {
  return JSON.stringify({ format: "it31-task-v1", category, note } satisfies TaskDetails);
}

export const api = {
  async list(): Promise<Task[]> {
    const items = await request<Item[]>("/api/items");
    return items.map(toTask);
  },

  async create(input: { title: string; category: string; note: string }): Promise<Task> {
    const item = await request<Item>("/api/items", {
      method: "POST",
      body: JSON.stringify({
        title: input.title,
        description: encodeDetails(input.category, input.note),
        status: "Offen",
        rating: 3,
      }),
    });
    return toTask(item);
  },

  async update(id: number, patch: { done: boolean }): Promise<Task> {
    const item = await request<Item>(`/api/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: patch.done ? "Erledigt" : "Offen" }),
    });
    return toTask(item);
  },

  remove(id: number): Promise<void> {
    return request<void>(`/api/items/${id}`, { method: "DELETE" });
  },
};