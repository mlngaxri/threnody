"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

const LINKS = [
  { href: "/atlas", label: "Atlas" },
  { href: "/timeline", label: "Timeline" },
  { href: "/categories", label: "Categories" },
  { href: "/search", label: "Search" },
  { href: "/method", label: "Method" },
  { href: "/contributors", label: "Contributors" },
  { href: "/contact", label: "Contact" },
];

/**
 * Navigation. On phones it collapses behind a real disclosure button with
 * correct aria-expanded and aria-controls, closes on Escape, returns focus to
 * the trigger, and closes on route change so the panel never outlives the page
 * that opened it.
 */
export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function isCurrent(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="nav">
      <div className="shell nav__inner" style={{ position: "relative" }}>
        <Link href="/" className="nav__brand" aria-label="THRENODY, home">
          THRENODY
        </Link>

        <button
          ref={toggleRef}
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>

        <nav aria-label="Primary">
          <ul className="nav__list" id={panelId} data-open={open ? "true" : "false"}>
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="nav__link"
                  aria-current={isCurrent(link.href) ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
