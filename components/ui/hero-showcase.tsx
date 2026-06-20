"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  useReducedMotion,
} from "motion/react";
import { Mark } from "./brand";

// A week of sample plan, Sunday-first (GCC), with GCC-flavoured meals.
type Day = {
  name: string;
  training: boolean;
  cal: number;
  meals: [string, string][];
};

const WEEK: Day[] = [
  {
    name: "Sunday",
    training: true,
    cal: 3120,
    meals: [
      ["Breakfast", "Shakshuka, oats, dates"],
      ["Lunch", "Grilled chicken, freekeh, salad"],
      ["Dinner", "Salmon, sweet potato, greens"],
    ],
  },
  {
    name: "Monday",
    training: true,
    cal: 3240,
    meals: [
      ["Breakfast", "Eggs, labneh, wholegrain toast"],
      ["Lunch", "Beef kofta, rice, tabbouleh"],
      ["Dinner", "Sea bass, quinoa, roast veg"],
    ],
  },
  {
    name: "Tuesday",
    training: false,
    cal: 2480,
    meals: [
      ["Breakfast", "Greek yoghurt, berries, nuts"],
      ["Lunch", "Lentil soup, chicken wrap"],
      ["Dinner", "Grilled halloumi, big salad"],
    ],
  },
  {
    name: "Wednesday",
    training: true,
    cal: 3300,
    meals: [
      ["Breakfast", "Oats, banana, peanut butter"],
      ["Lunch", "Chicken shawarma, rice, hummus"],
      ["Dinner", "Salmon, bulgur, grilled veg"],
    ],
  },
  {
    name: "Thursday",
    training: true,
    cal: 3180,
    meals: [
      ["Breakfast", "Foul medames, eggs, bread"],
      ["Lunch", "Turkey, sweet potato, greens"],
      ["Dinner", "Grilled chicken, pasta, salad"],
    ],
  },
  {
    name: "Friday",
    training: false,
    cal: 2420,
    meals: [
      ["Breakfast", "Smoothie bowl, seeds"],
      ["Lunch", "Machboos (light), salad"],
      ["Dinner", "Baked cod, vegetables"],
    ],
  },
  {
    name: "Saturday",
    training: true,
    cal: 3450,
    meals: [
      ["Breakfast", "Pancakes, eggs, fruit"],
      ["Lunch", "Steak, rice, grilled veg"],
      ["Dinner", "Chicken, potatoes, greens"],
    ],
  },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export function HeroShowcase() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const day = WEEK[i];

  // Auto-advance through the week (paused for reduced motion).
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((p) => (p + 1) % WEEK.length), 2900);
    return () => clearInterval(t);
  }, [reduce]);

  // Calories tween smoothly from the previous day to the current one.
  const [cal, setCal] = useState(WEEK[0].cal);
  const prev = useRef(WEEK[0].cal);
  useEffect(() => {
    let raf = 0;
    const from = prev.current;
    const to = day.cal;
    const start = performance.now();
    const ms = reduce ? 0 : 900;
    const tick = (now: number) => {
      const t = ms === 0 ? 1 : Math.min(1, (now - start) / ms);
      const e = 1 - Math.pow(1 - t, 3);
      setCal(Math.round(from + (to - from) * e));
      if (t < 1) raf = requestAnimationFrame(tick);
      else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [i, day.cal, reduce]);

  // 3D tilt + pointer-tracked glare.
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 150, damping: 17, mass: 0.6 };
  const rotateX = useSpring(useTransform(py, [0, 1], [10, -10]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-14, 14]), spring);
  const gx = useTransform(px, [0, 1], ["0%", "100%"]);
  const gy = useTransform(py, [0, 1], ["0%", "100%"]);
  const glare = useMotionTemplate`radial-gradient(260px 260px at ${gx} ${gy}, rgba(255,255,255,0.14), transparent 60%)`;

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  }
  function reset() {
    px.set(0.5);
    py.set(0.5);
  }

  const fuelPct = Math.max(0, Math.min(1, (cal - 2200) / (3600 - 2200)));
  const tiltStyle = reduce
    ? undefined
    : { rotateX, rotateY, transformPerspective: 1100 };

  return (
    <div className="mx-auto max-w-sm">
      <motion.div
        onPointerMove={reduce ? undefined : onMove}
        onPointerLeave={reduce ? undefined : reset}
        style={tiltStyle}
        className="relative will-change-transform [transform-style:preserve-3d]"
      >
        <div className="tq-card relative overflow-hidden rounded-3xl shadow-[0_30px_80px_-30px_rgba(16,185,129,0.45)]">
          {/* ── Header (gradient crossfades only when day type changes) ── */}
          <div className="relative h-[92px]">
            <AnimatePresence initial={false}>
              <motion.div
                key={day.training ? "train" : "rest"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className={`absolute inset-0 ${
                  day.training
                    ? "bg-gradient-to-br from-[#0a8f6a] via-[#10b981] to-[#34d399]"
                    : "bg-gradient-to-br from-[#26413a] to-[#0f1d17]"
                }`}
              />
            </AnimatePresence>
            <div className="pointer-events-none absolute inset-0 turf-grid opacity-30" />

            <div className="relative flex h-full items-center justify-between px-5">
              <div className="overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={i}
                    initial={{ y: 22, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -22, opacity: 0 }}
                    transition={{ duration: 0.45, ease: EASE }}
                  >
                    <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white/75">
                      {day.training ? "Training Day" : "Rest Day"}
                    </p>
                    <h3 className="font-display text-2xl font-semibold leading-tight text-white">
                      {day.name}
                    </h3>
                  </motion.div>
                </AnimatePresence>
              </div>
              <Mark className="h-8 w-8 opacity-90" />
            </div>
          </div>

          {/* ── Body ──────────────────────────────────────────────────── */}
          <div className="px-5 py-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-mist">Target fuel</p>
                <span className="tabular text-3xl font-semibold text-white">
                  {cal.toLocaleString()}{" "}
                  <span className="text-base text-mist">kcal</span>
                </span>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 font-mono text-[0.62rem] font-semibold uppercase tracking-widest ${
                  day.training
                    ? "bg-charge/15 text-volt"
                    : "bg-white/8 text-mist"
                }`}
              >
                {day.training ? "Fuel" : "Recover"}
              </span>
            </div>

            {/* Calorie fuel bar — fills toward the day's target */}
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-pitch-line">
              <div
                className="h-full rounded-full bg-gradient-to-r from-volt via-charge to-fuel transition-[width] duration-700 ease-out"
                style={{ width: `${30 + fuelPct * 70}%` }}
              />
            </div>

            {/* Meals swap per day */}
            <div className="mt-4 min-h-[148px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="space-y-3"
                >
                  {day.meals.map(([label, text]) => (
                    <div key={label} className="border-t border-pitch-line pt-3">
                      <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-mist-2">
                        {label}
                      </p>
                      <p className="mt-0.5 text-sm text-white/90">{text}</p>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Day rail — shows the week auto-generating, current day lit */}
            <div className="mt-4 flex items-center gap-1.5">
              {WEEK.map((d, idx) => (
                <span
                  key={d.name}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                    idx === i
                      ? d.training
                        ? "bg-charge"
                        : "bg-mist"
                      : "bg-pitch-line"
                  }`}
                />
              ))}
            </div>
            <p className="mt-2 flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-mist-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-charge opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-charge" />
              </span>
              AI-generated · day {i + 1} of 7
            </p>
          </div>

          {/* Glare — painted INSIDE the card, clipped to its rounded shape */}
          {!reduce && (
            <motion.div
              aria-hidden="true"
              style={{ background: glare }}
              className="pointer-events-none absolute inset-0 z-30 mix-blend-soft-light"
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
