"use client";

/*
  PROTOTYPE ONLY. Floating variant switcher. Deliberately styled to look
  nothing like the design under evaluation, so it never reads as part of it.
  Hidden in production builds.
*/

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CaretLeft, CaretRight, MoonStars, Sun } from "@phosphor-icons/react";

/* B ("The Table", the photography-led editorial one) was rejected in
   review as a cliche and is no longer in the rotation. It stays on this
   branch in git history rather than in the switcher. */
export const VARIANTS = [
  { key: "D", name: "Menu Card + conversation" },
  { key: "A", name: "Menu Card" },
  { key: "C", name: "The Conversation" },
] as const;

export function PrototypeSwitcher() {
  const router = useRouter();
  const params = useSearchParams();
  const current = (params.get("variant") ?? "D").toUpperCase();
  const index = Math.max(
    0,
    VARIANTS.findIndex((v) => v.key === current),
  );

  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light",
    );
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
  };

  const go = (step: number) => {
    const next = VARIANTS[(index + step + VARIANTS.length) % VARIANTS.length];
    router.replace(`?variant=${next.key}`, { scroll: false });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-[#101014] p-1.5 font-sans text-white shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/15">
        <button
          onClick={() => go(-1)}
          aria-label="Previous variant"
          className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-white/15"
        >
          <CaretLeft size={16} weight="bold" />
        </button>
        <span className="min-w-[180px] px-2 text-center text-[13px] tabular-nums">
          {VARIANTS[index].key}
          <span className="opacity-60"> ({VARIANTS[index].name})</span>
        </span>
        <button
          onClick={() => go(1)}
          aria-label="Next variant"
          className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-white/15"
        >
          <CaretRight size={16} weight="bold" />
        </button>
        <span aria-hidden className="mx-1 h-5 w-px bg-white/20" />
        <button
          onClick={toggleTheme}
          aria-label="Toggle light and dark"
          className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-white/15"
        >
          {theme === "dark" ? <Sun size={16} /> : <MoonStars size={16} />}
        </button>
      </div>
    </div>
  );
}
