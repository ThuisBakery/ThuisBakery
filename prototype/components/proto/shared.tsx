/*
  PROTOTYPE ONLY. Shared scaffolding for the three design directions.
  Only the header, footer, wordmark, motif and data live here. Every
  variant owns its own layout outright, per the prototype skill's rule
  against a shared <Layout>.
*/

import Image from "next/image";

/* ---------------------------------------------------------------- data --
   Catalogue copy is lifted verbatim from Jana's printed menu card, so the
   euro figures below are hers, not invented. Nibbles is the exception: it
   exists in ADR-0003's Category ladder but is absent from her card, so it
   carries no price here and surfaces as an open content question.
*/

export type Category = {
  slug: string;
  name: string;
  tagline: string;
  note?: string;
  price: string | null;
  seed: string;
};

export const CATEGORIES: Category[] = [
  {
    slug: "proefhapjes",
    name: "Proefhapjes",
    tagline: "Monthly limited editions",
    note: "a little taste of what's baking at Thuis",
    price: "€29",
    seed: "thuisbakery-proefhapjes-tasting-board",
  },
  {
    slug: "bento",
    name: "Cheeky Bento Cakes",
    tagline: "Mini cakes for big moments",
    note: "personalisation available on request",
    price: "from €25",
    seed: "thuisbakery-bento-mini-cake",
  },
  {
    slug: "indulgent",
    name: "Indulgent Cakes",
    tagline: "For life's sweetest moments, or simply just because.",
    price: "from €52",
    seed: "thuisbakery-indulgent-layer-cake",
  },
  {
    slug: "specialty",
    name: "Specialty Cakes",
    tagline: "Burnt Basque cheesecake, and carrot cake",
    price: "from €49",
    seed: "thuisbakery-basque-cheesecake",
  },
  {
    slug: "nibbles",
    name: "Nibbles",
    tagline: "Cookies and brownies, by the box",
    // Absent from Jana's menu card. Left unpriced rather than invented.
    price: null,
    seed: "thuisbakery-brownies-cookies-box",
  },
];

export const ITEMS = [
  { name: "Burnt Basque Cheesecake", price: "€56", seed: "thuisbakery-basque" },
  { name: "Carrot Cake", price: "€49", seed: "thuisbakery-carrot-cake" },
  { name: "Red Velvet, six inch", price: "€52", seed: "thuisbakery-red-velvet" },
  { name: "Funfetti Bento", price: "€25", seed: "thuisbakery-funfetti-bento" },
  { name: "Salted Caramel Brownies", price: "€18", seed: "thuisbakery-brownies" },
];

export const NAV = [
  { href: "#cakes", label: "Cakes" },
  { href: "#nibbles", label: "Nibbles" },
  { href: "#about", label: "About Jana" },
  { href: "#enquiry", label: "Enquire" },
];

/* The single CTA label for the "start an enquiry" intent. Used in the nav,
   the hero and the closing band. One label per intent, everywhere. */
export const CTA = "Start an enquiry";

export function img(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

/* ------------------------------------------------------------- wordmark --
   Jana's card sets the business name once, large, in a looping script.
   Reproduced here rather than invented.
*/

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-script leading-none ${className}`}>ThuisBakery</span>
  );
}

/* ---------------------------------------------------------------- motif --
   The single-stroke cake stand from the foot of Jana's menu card. This is
   the one hand-drawn SVG in the prototype: it is an existing brand mark
   being reproduced, not decoration invented to fill space.
*/

export function CakeStand({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 56"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M32 6c1.6 0 2.6 1.1 2.6 2.4 0 1.6-2.6 3.4-2.6 3.4s-2.6-1.8-2.6-3.4C29.4 7.1 30.4 6 32 6Z" />
      <path d="M12 34c0-11 9-22 20-22s20 11 20 22" />
      <path d="M12 34c3.4 0 3.4 3 6.8 3s3.3-3 6.7-3 3.4 3 6.8 3 3.3-3 6.7-3 3.4 3 6.8 3 3.3-3 6.2-3" />
      <path d="M10 38h44" />
      <path d="M32 38v10" />
      <path d="M20 52c0-2.2 5.4-4 12-4s12 1.8 12 4" />
    </svg>
  );
}

/* --------------------------------------------------------------- header --
   One line at desktop, 72px tall. Shared across all three variants because
   navigation is not what the variants disagree about.
*/

export function Header({ overlay = false }: { overlay?: boolean }) {
  return (
    <header
      className={
        overlay
          ? "absolute inset-x-0 top-0 z-20 text-[var(--accent-ink)]"
          : "relative z-20 text-ink"
      }
    >
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-5 md:px-10">
        <a href="#top" className="text-2xl md:text-[28px]">
          <Wordmark />
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-[13px] tracking-wide opacity-80 transition-opacity duration-300 hover:opacity-100"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <a
          href="#enquiry"
          className="border border-current px-4 py-2 text-[12px] tracking-wide whitespace-nowrap transition-colors duration-300 hover:bg-accent hover:text-accent-ink hover:border-accent md:px-5"
        >
          {CTA}
        </a>
      </div>
    </header>
  );
}

/* --------------------------------------------------------------- footer -- */

export function Footer() {
  return (
    <footer className="bg-ground px-5 pt-16 pb-10 text-ink md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="hairline" />
        <div className="grid gap-10 pt-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="text-3xl">
              <Wordmark />
            </p>
            <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-ink-muted">
              Baked at home in Uithoorn. Pickup by arrangement, with the
              address sent when your date is confirmed.
            </p>
          </div>
          <div>
            <p className="font-display text-lg">Menu</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-muted">
              {CATEGORIES.slice(0, 4).map((c) => (
                <li key={c.slug}>{c.name}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-display text-lg">Get in touch</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-muted">
              <li>hallo@thuisbakery.com</li>
              <li>Uithoorn, Noord-Holland</li>
              <li>Nederlands / English</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 text-xs text-ink-muted md:flex-row md:items-center md:justify-between">
          <p>ThuisBakery, Uithoorn. KvK number to follow.</p>
          <p>Privacy</p>
        </div>
      </div>
    </footer>
  );
}

/* ----------------------------------------------------------- photo slot -- */

export function Photo({
  seed,
  alt,
  width,
  height,
  priority = false,
  className = "",
  sizes = "100vw",
}: {
  seed: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
}) {
  return (
    <Image
      src={img(seed, width, height)}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      sizes={sizes}
      className={className}
    />
  );
}
