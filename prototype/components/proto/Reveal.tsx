"use client";

/*
  PROTOTYPE ONLY. The single motion primitive in this prototype.

  MOTION_INTENSITY is 4, so motion is limited to entry reveal, and its job
  is hierarchy: content arrives in reading order so the eye is led down the
  page rather than hit with all of it at once. No pinning, no scroll
  hijack, no marquee physics, no infinite loops. Both competitor sites
  move constantly; holding still is part of the direction.

  Collapses to static under prefers-reduced-motion.
*/

import { motion, useReducedMotion } from "motion/react";

export function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
  id,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section";
  id?: string;
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  return (
    <Tag
      id={id}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </Tag>
  );
}
