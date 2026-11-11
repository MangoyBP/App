import { useEffect, useState } from "preact/hooks";
import type { Item } from "../shared/types";

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/items")
      .then((response) => {
        if (!response.ok) throw new Error("Die Demo-Einträge konnten nicht geladen werden.");
        return response.json() as Promise<Item[]>;
      })
      .then((data) => {
        if (active) setItems(data);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Unbekannter Fehler");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const completed = items.filter((item) => item.status === "Erledigt").length;

  return (
    <main class="page-shell">
      <header class="topbar">
        <a class="wordmark" href="/" aria-label="IT31 Demo Startseite">
          <span class="mark">I</span>
          <span>IT31 <b>STUDIO</b></span>
        </a>
        <span class="topbar-note">MODUL 01 <i /> PROJEKTSTART</span>
      </header>

      <section class="intro" aria-labelledby="page-title">
        <div class="intro-copy">
          <p class="eyebrow">DEIN PROJEKT, EIN ORT</p>
          <h1 id="page-title">IT31 Demo<span>.</span></h1>
          <p class="lead">Ein kleiner Anfang für eine Fullstack-App. Frontend, API und Datenbank arbeiten hier zusammen.</p>
        </div>
        <div class="intro-stamp" aria-hidden="true"><span>BUILD</span><strong>01</strong><span>LEARN BY DOING</span></div>
      </section>

      <section class="workspace" aria-labelledby="items-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">ÜBERSICHT</p>
            <h2 id="items-title">Deine ersten Schritte</h2>
          </div>
          <div class="progress-count"><strong>{completed.toString().padStart(2, "0")}</strong><span> / {items.length.toString().padStart(2, "0")} erledigt</span></div>
        </div>

        {loading && <p class="message" role="status">Einträge werden geladen …</p>}
        {error && <p class="message error" role="alert">{error}</p>}
        {!loading && !error && (
          <ul class="item-list">
            {items.map((item, index) => (
              <li class="item-row" key={item.id}>
                <span class="item-number">0{index + 1}</span>
                <div class="item-copy">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <span class={`status status-${item.status === "Erledigt" ? "done" : item.status === "In Arbeit" ? "active" : "open"}`}>
                  <i />{item.status}
                </span>
                <span class="row-arrow" aria-hidden="true">↗</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer class="footer"><span>FULLSTACK STARTER</span><span>PREACT <i /> HONO <i /> SQLITE</span></footer>
    </main>
  );
}