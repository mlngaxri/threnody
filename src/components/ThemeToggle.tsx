"use client";

import { useEffect, useState } from "react";

/**
 * Two genuine art directions rather than an inversion: the dark setting is a
 * listening room, the light setting is archival paper. The preference persists
 * and defaults to the operating system.
 *
 * ThemeScript runs before paint to avoid a flash of the wrong theme. It is a
 * fixed string with no interpolation of any external value.
 */

const STORAGE_KEY = "threnody-theme";

export function ThemeScript() {
  const script = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light" | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable in private modes. The toggle still works
      // for this session, it simply will not persist.
    }
  }

  // Rendered only after mount so the label always matches the real state.
  if (theme === null) {
    return (
      <div
        aria-hidden="true"
        style={{ position: "fixed", insetInlineEnd: "var(--sp-4)", insetBlockEnd: "var(--sp-4)", width: 0, height: 0 }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn"
      aria-pressed={theme === "light"}
      style={{
        position: "fixed",
        insetInlineEnd: "var(--sp-4)",
        insetBlockEnd: "var(--sp-4)",
        zIndex: 90,
        background: "var(--bg-raised)",
        minHeight: "44px",
      }}
    >
      <span aria-hidden="true">{theme === "light" ? "Paper" : "Room"}</span>
      <span className="visually-hidden">
        {theme === "light"
          ? "Paper theme active. Activate for the dark listening room theme."
          : "Listening room theme active. Activate for the light paper theme."}
      </span>
    </button>
  );
}
