"use client";

/*
  PROTOTYPE ONLY. The centrepiece of Variant C.

  This exists to answer one design question: can the running Estimate that
  #11 settled on sit on the page without reading as a checkout? It is a
  read-only sketch. Nothing submits anywhere.

  Estimate scope is exactly what #11 allows: Size, quantity and Surcharges.
  Nothing personalised is priced here.
*/

import { useState } from "react";
import { Info } from "@phosphor-icons/react";

/* Size prices: the 6 inch figure is Jana's own, off the menu card. The two
   larger sizes are placeholders for this prototype and need her numbers. */
const SIZES = [
  { id: "bento", label: "Bento, 4 inch", serves: "1 to 2", price: 25 },
  { id: "six", label: "Six inch, two layers", serves: "8 to 10", price: 52 },
  { id: "eight", label: "Eight inch, two layers", serves: "16 to 20", price: 74 }, // placeholder
  { id: "ten", label: "Ten inch, three layers", serves: "30 to 36", price: 110 }, // placeholder
];

const SPONGES = ["Chocolate", "Vanilla", "Funfetti", "Red Velvet"];

const FILLINGS = [
  { id: "cream-cheese", label: "Cream Cheese", surcharge: 0 },
  { id: "ganache", label: "Ganache", surcharge: 4 },
  { id: "salted-caramel", label: "Salted Caramel", surcharge: 6 },
];

const LEAD_DAYS = 4;

function euro(n: number) {
  return `€${n.toFixed(2).replace(".00", "")}`;
}

export function EnquiryForm() {
  const [sizeId, setSizeId] = useState<string>("");
  const [sponge, setSponge] = useState<string>("");
  const [fillingId, setFillingId] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const size = SIZES.find((s) => s.id === sizeId);
  const filling = FILLINGS.find((f) => f.id === fillingId);

  const subtotal = size ? (size.price + (filling?.surcharge ?? 0)) * qty : 0;

  const earliest = new Date(Date.now() + LEAD_DAYS * 864e5);
  const dateTooSoon = date !== "" && new Date(date) < earliest;

  const canSend = Boolean(size) && date !== "" && !dateTooSoon;

  const field =
    "mt-2 w-full border border-rule bg-raised px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none";
  const label = "block text-[13px] font-medium tracking-wide";
  const helper = "mt-1.5 text-[13px] text-ink-muted";

  return (
    <div className="grid gap-10 md:grid-cols-[1.25fr_1fr] md:gap-14">
      {/* ------------------------------------------------------- the form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setStatus("sending");
          setTimeout(() => setStatus("sent"), 1200);
        }}
        className="space-y-7"
      >
        <fieldset>
          <legend className={label}>How big</legend>
          <p className={helper}>
            Sizes are by servings, not by how they look in a photograph.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {SIZES.map((s) => {
              const active = s.id === sizeId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSizeId(s.id)}
                  aria-pressed={active}
                  className={`border px-4 py-3 text-left transition-colors duration-200 active:translate-y-px ${
                    active
                      ? "border-accent bg-accent text-accent-ink"
                      : "border-rule bg-raised text-ink hover:border-ink-muted"
                  }`}
                >
                  <span className="block text-[15px]">{s.label}</span>
                  <span
                    className={`mt-0.5 block text-[13px] ${active ? "opacity-85" : "text-ink-muted"}`}
                  >
                    Serves {s.serves}, {euro(s.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="sponge">
              Sponge
            </label>
            <select
              id="sponge"
              value={sponge}
              onChange={(e) => setSponge(e.target.value)}
              className={field}
            >
              <option value="">Choose a sponge</option>
              {SPONGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className={helper}>No extra cost, whichever you pick.</p>
          </div>

          <div>
            <label className={label} htmlFor="filling">
              Filling
            </label>
            <select
              id="filling"
              value={fillingId}
              onChange={(e) => setFillingId(e.target.value)}
              className={field}
            >
              <option value="">Choose a filling</option>
              {FILLINGS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                  {f.surcharge ? ` (+${euro(f.surcharge)})` : ""}
                </option>
              ))}
            </select>
            <p className={helper}>Some fillings add a little.</p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="qty">
              How many
            </label>
            <input
              id="qty"
              type="number"
              min={1}
              max={20}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              className={field}
            />
          </div>

          <div>
            <label className={label} htmlFor="date">
              Pickup date you are hoping for
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-invalid={dateTooSoon}
              aria-describedby={dateTooSoon ? "date-error" : "date-help"}
              className={`${field} ${dateTooSoon ? "border-accent" : ""}`}
            />
            {dateTooSoon ? (
              <p
                id="date-error"
                className="mt-1.5 text-[13px] font-medium text-accent"
              >
                Jana needs {LEAD_DAYS} days. Send it anyway and she will tell
                you if she can squeeze it in.
              </p>
            ) : (
              <p id="date-help" className={helper}>
                Requested, not confirmed. Jana replies to agree the day.
              </p>
            )}
          </div>
        </div>

        <div>
          <label className={label} htmlFor="notes">
            Anything else she should know
          </label>
          <textarea
            id="notes"
            rows={3}
            placeholder="A name to write, a colour, a theme, an allergy"
            className={field}
          />
          <p className={helper}>
            Written messages, colours and themes are priced by Jana, so they do
            not move the estimate.
          </p>
        </div>

        <button
          type="submit"
          disabled={!canSend || status !== "idle"}
          className="w-full bg-accent px-7 py-4 text-sm whitespace-nowrap text-accent-ink transition-transform duration-200 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
        >
          {status === "sending"
            ? "Sending to Jana"
            : status === "sent"
              ? "Sent to Jana"
              : "Send this to Jana"}
        </button>

        {status === "sent" ? (
          <p className="text-[15px] text-ink">
            She usually answers within a day. Nothing is booked until she
            replies.
          </p>
        ) : null}
      </form>

      {/* --------------------------------------------------- the estimate */}
      <aside className="md:sticky md:top-6 md:self-start">
        <div className="border border-rule bg-raised p-6 md:p-7">
          <h3 className="font-display text-2xl">Your estimate</h3>

          {!size ? (
            /* Empty state: composed, and says how to fill it. */
            <div className="mt-6 space-y-3">
              <div className="h-px w-full bg-[var(--rule)]" />
              <p className="text-[15px] leading-relaxed text-ink-muted">
                Pick a size and the figure appears here, updating as you go.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <div className="flex items-baseline justify-between gap-4 text-[15px]">
                <span>{size.label}</span>
                <span className="tabular-nums text-ink-muted">
                  {euro(size.price)}
                </span>
              </div>
              {filling && filling.surcharge > 0 ? (
                <div className="flex items-baseline justify-between gap-4 text-[15px]">
                  <span>{filling.label}</span>
                  <span className="tabular-nums text-ink-muted">
                    {euro(filling.surcharge)}
                  </span>
                </div>
              ) : null}
              {qty > 1 ? (
                <div className="flex items-baseline justify-between gap-4 text-[15px]">
                  <span>Quantity</span>
                  <span className="tabular-nums text-ink-muted">
                    &times;{qty}
                  </span>
                </div>
              ) : null}
              <div className="h-px w-full bg-[var(--rule)]" />
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-display text-xl">Around</span>
                <span className="font-display text-3xl tabular-nums">
                  {euro(subtotal)}
                </span>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-start gap-2.5 border-t border-rule pt-5">
            <Info size={17} className="mt-0.5 shrink-0 text-accent" />
            <p className="text-[13px] leading-relaxed text-ink-muted">
              Provisional. It covers size, quantity and fillings only. Jana
              confirms the real price when she replies.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
