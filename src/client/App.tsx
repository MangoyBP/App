import { useEffect, useState } from "preact/hooks";
import { api, type Task } from "./api";

function errorMessage(cause: unknown) {
  return cause instanceof Error ? cause.message : "Unerwarteter Fehler. Bitte versuche es erneut.";
}

export default function App() {
  const [items, setItems] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    api
      .list()
      .then((data) => {
        if (active) setItems(data);
      })
      .catch((cause: unknown) => {
        if (active) setError(errorMessage(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const completed = items.filter((item) => item.done).length;

  async function reloadItems() {
    setLoading(true);
    setError("");
    try {
      setItems(await api.list());
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }

  async function addItem(event: Event) {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanCategory = category.trim();
    if (!cleanTitle || !cleanCategory) {
      setError("Bitte gib einen Titel und eine Kategorie ein.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await api.create({ title: cleanTitle, category: cleanCategory, note: "" });
      setItems(await api.list());
      setTitle("");
      setCategory("");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  async function toggleItem(item: Task, done: boolean) {
    setBusyId(item.id);
    setError("");
    try {
      await api.update(item.id, { done });
      setItems(await api.list());
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  }

  async function deleteItem(item: Task) {
    setBusyId(item.id);
    setError("");
    try {
      await api.remove(item.id);
      setItems(await api.list());
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div class="min-h-screen bg-paper text-ink">
      <header class="mx-auto flex h-[72px] max-w-6xl items-center justify-between border-b border-line px-4 sm:px-6 lg:px-8">
        <a class="flex items-center gap-3 text-sm font-extrabold tracking-wide" href="/" aria-label="IT31 Studio Startseite">
          <span class="grid size-9 place-items-center rounded-lg bg-moss font-display text-lg text-white">I</span>
          <span>IT31 <span class="text-muted">STUDIO</span></span>
        </a>
        <span class="text-[10px] font-bold tracking-[0.16em] text-muted">MODUL 03 <span class="px-2 text-coral">/</span> WERKSTATT</span>
      </header>

      <main class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <section class="grid gap-8 border-b border-line py-12 sm:py-16 md:grid-cols-[minmax(0,1fr)_220px] md:items-end" aria-labelledby="page-title">
          <div>
            <p class="mb-4 text-[11px] font-extrabold tracking-[0.2em] text-moss">IDEEN SORTIEREN, SCHRITT FÜR SCHRITT</p>
            <h1 id="page-title" class="mb-4 max-w-3xl font-display text-5xl leading-[0.98] sm:text-6xl">Deine <span class="text-coral">Werkstatt.</span></h1>
            <p class="max-w-xl text-base leading-7 text-muted">Sammle die nächsten Schritte für dein Projekt und hake ab, was schon geschafft ist.</p>
          </div>
          <div class="flex items-end gap-3 border-l-2 border-coral pl-4 md:justify-self-end">
            <strong class="font-display text-5xl leading-none text-moss">{completed.toString().padStart(2, "0")}</strong>
            <span class="pb-1 text-sm text-muted">von {items.length.toString().padStart(2, "0")} erledigt</span>
          </div>
        </section>

        <section class="border-b border-line py-8" aria-labelledby="new-item-title">
          <div class="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p class="mb-2 text-[10px] font-extrabold tracking-[0.18em] text-coral">NEUER EINTRAG</p>
              <h2 id="new-item-title" class="font-display text-2xl">Was steht als Nächstes an?</h2>
            </div>
            <span class="text-xs text-muted">Titel und Kategorie reichen fürs Erste.</span>
          </div>
          <form class="grid gap-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(180px,0.8fr)_auto] sm:items-end" noValidate onSubmit={addItem}>
            <label class="grid gap-1.5 text-xs font-semibold text-ink" for="item-title">
              Titel
              <input
                id="item-title"
                class="h-11 min-w-0 rounded-md border border-line bg-white px-3 text-sm font-normal outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15"
                value={title}
                onInput={(event) => setTitle((event.currentTarget as HTMLInputElement).value)}
                placeholder="Zum Beispiel: API testen"
                maxLength={120}
                aria-required="true"
              />
            </label>
            <label class="grid gap-1.5 text-xs font-semibold text-ink" for="item-category">
              Kategorie
              <input
                id="item-category"
                class="h-11 min-w-0 rounded-md border border-line bg-white px-3 text-sm font-normal outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15"
                value={category}
                onInput={(event) => setCategory((event.currentTarget as HTMLInputElement).value)}
                placeholder="Zum Beispiel: Backend"
                maxLength={80}
                aria-required="true"
              />
            </label>
            <button
              class="h-11 rounded-md bg-moss px-5 text-sm font-bold text-white transition hover:bg-moss-dark focus:outline-none focus:ring-2 focus:ring-moss/40 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              type="submit"
              disabled={saving}
            >
              {saving ? "Wird gespeichert …" : "＋ Hinzufügen"}
            </button>
          </form>
        </section>

        <section class="py-8 sm:py-10" aria-labelledby="items-title">
          <div class="mb-4 flex items-end justify-between gap-4">
            <div>
              <p class="mb-2 text-[10px] font-extrabold tracking-[0.18em] text-moss">DEIN PROJEKT</p>
              <h2 id="items-title" class="font-display text-2xl">Nächste Schritte</h2>
            </div>
            <span class="pb-1 text-xs tabular-nums text-muted">{items.length} {items.length === 1 ? "Eintrag" : "Einträge"}</span>
          </div>

          {error && (
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral" role="alert">
              <span>{error}</span>
              <button class="font-bold underline decoration-coral/40 underline-offset-4 hover:decoration-coral" type="button" onClick={reloadItems}>
                Erneut versuchen
              </button>
            </div>
          )}

          {loading && <p class="border-y border-line py-8 text-sm text-muted" role="status">Einträge werden geladen …</p>}
          {!loading && items.length === 0 && !error && (
            <p class="border-y border-line py-10 text-sm text-muted">Noch ist die Werkbank leer. Lege oben deinen ersten Schritt an.</p>
          )}
          {!loading && items.length > 0 && (
            <ul class="divide-y divide-line border-y border-line">
              {items.map((item, index) => (
                <li class="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 py-4 sm:grid-cols-[34px_24px_minmax(0,1fr)_auto] sm:gap-4" key={item.id}>
                  <span class="hidden font-mono text-xs text-muted/70 sm:block">{String(index + 1).padStart(2, "0")}</span>
                  <input
                    class="size-5 cursor-pointer accent-moss disabled:cursor-wait"
                    type="checkbox"
                    checked={item.done}
                    disabled={busyId === item.id}
                    aria-label={`${item.done ? "Als offen markieren" : "Als erledigt markieren"}: ${item.title}`}
                    onChange={(event) => toggleItem(item, (event.currentTarget as HTMLInputElement).checked)}
                  />
                  <div class="min-w-0">
                    <h3 class={`break-words text-sm font-bold sm:text-base ${item.done ? "text-muted line-through decoration-coral/70" : "text-ink"}`}>
                      {item.title}
                    </h3>
                    <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span class="rounded-sm bg-leaf px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-moss">{item.category}</span>
                      {item.note && <p class="m-0 min-w-0 text-xs leading-5 text-muted">{item.note}</p>}
                    </div>
                  </div>
                  <button
                    class="rounded px-2 py-1 text-xs font-semibold text-muted transition hover:bg-coral/10 hover:text-coral focus:outline-none focus:ring-2 focus:ring-coral/30 disabled:cursor-wait disabled:opacity-50"
                    type="button"
                    disabled={busyId === item.id}
                    aria-label={`Eintrag löschen: ${item.title}`}
                    title="Eintrag löschen"
                    onClick={() => deleteItem(item)}
                  >
                    Löschen
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer class="flex flex-wrap justify-between gap-3 border-t border-line py-5 text-[9px] font-bold tracking-[0.14em] text-muted">
          <span>IT31 STUDIO · MODUL 03</span>
          <span>PREACT <span class="px-1 text-coral">/</span> HONO <span class="px-1 text-coral">/</span> SQLITE</span>
        </footer>
      </main>
    </div>
  );
}