"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Reveal — fades + slides its children up when scrolled into view.
 * Honors prefers-reduced-motion (renders static, fully visible).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 22,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger — orchestrates child <StaggerItem>s to enter one after another.
 */
export function Stagger({
  children,
  className,
  gap = 0.09,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{ show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  y = 18,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * PowerBar — the signature "charge" motif: a segmented energy bar whose
 * segments light up in sequence when revealed. Decorative.
 */
export function PowerBar({
  segments = 14,
  className,
}: {
  segments?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`} aria-hidden>
      {Array.from({ length: segments }).map((_, i) => (
        <motion.span
          key={i}
          className="h-1.5 flex-1 rounded-full"
          style={{
            background:
              i > segments - 4
                ? "var(--color-fuel)" // last few segments tip into "fuel"
                : "var(--color-charge)",
            transformOrigin: "bottom",
          }}
          initial={reduce ? false : { opacity: 0.12, scaleY: 0.4 }}
          whileInView={reduce ? undefined : { opacity: 1, scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.045, duration: 0.4, ease: EASE }}
        />
      ))}
    </div>
  );
}
