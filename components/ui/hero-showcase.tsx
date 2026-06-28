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
import { useI18n } from "@/components/i18n/language-provider";

// A week of sample plan, Sunday-first (GCC), with GCC-flavoured meals.
// `name` is the English day key (mapped to the localized name at render).
// Meal dishes carry both languages so the showcase reads natively in either.
type Meal = { en: string; ar: string };
type Day = {
  name: string;
  training: boolean;
  cal: number;
  meals: Meal[];
};

const WEEK: Day[] = [
  {
    name: "Sunday",
    training: true,
    cal: 3120,
    meals: [
      { en: "Shakshuka, oats, dates", ar: "شكشوكة، شوفان، تمر" },
      { en: "Grilled chicken, freekeh, salad", ar: "دجاج مشوي، فريكة، سلطة" },
      { en: "Salmon, sweet potato, greens", ar: "سلمون، بطاطا حلوة، خضار" },
    ],
  },
  {
    name: "Monday",
    training: true,
    cal: 3240,
    meals: [
      { en: "Eggs, labneh, wholegrain toast", ar: "بيض، لبنة، خبز كامل محمّص" },
      { en: "Beef kofta, rice, tabbouleh", ar: "كفتة لحم، أرز، تبولة" },
      { en: "Sea bass, quinoa, roast veg", ar: "قاروص، كينوا، خضار مشوية" },
    ],
  },
  {
    name: "Tuesday",
    training: false,
    cal: 2480,
    meals: [
      { en: "Greek yoghurt, berries, nuts", ar: "زبادي يوناني، توت، مكسّرات" },
      { en: "Lentil soup, chicken wrap", ar: "شوربة عدس، لفافة دجاج" },
      { en: "Grilled halloumi, big salad", ar: "حلوم مشوي، سلطة كبيرة" },
    ],
  },
  {
    name: "Wednesday",
    training: true,
    cal: 3300,
    meals: [
      { en: "Oats, banana, peanut butter", ar: "شوفان، موز، زبدة فول سوداني" },
      { en: "Chicken shawarma, rice, hummus", ar: "شاورما دجاج، أرز، حمّص" },
      { en: "Salmon, bulgur, grilled veg", ar: "سلمون، برغل، خضار مشوية" },
    ],
  },
  {
    name: "Thursday",
    training: true,
    cal: 3180,
    meals: [
      { en: "Foul medames, eggs, bread", ar: "فول مدمس، بيض، خبز" },
      { en: "Turkey, sweet potato, greens", ar: "ديك رومي، بطاطا حلوة، خضار" },
      { en: "Grilled chicken, pasta, salad", ar: "دجاج مشوي، معكرونة، سلطة" },
    ],
  },
  {
    name: "Friday",
    training: false,
    cal: 2420,
    meals: [
      { en: "Smoothie bowl, seeds", ar: "وعاء سموذي، بذور" },
      { en: "Machboos (light), salad", ar: "مجبوس (خفيف)، سلطة" },
      { en: "Baked cod, vegetables", ar: "سمك القد بالفرن، خضار" },
    ],
  },
  {
    name: "Saturday",
    training: true,
    cal: 3450,
    meals: [
      { en: "Pancakes, eggs, fruit", ar: "فطائر، بيض، فاكهة" },
      { en: "Steak, rice, grilled veg", ar: "ستيك، أرز، خضار مشوية" },
      { en: "Chicken, potatoes, greens", ar: "دجاج، بطاطا، خضار" },
    ],
  },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export function HeroShowcase() {
  const { locale, t } = useI18n();
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const day = WEEK[i];
  // The three meal category labels, in order, for the localized UI.
  const mealLabels = [t.mealCard.breakfast, t.mealCard.lunch, t.mealCard.dinner];

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
                      {day.training ? t.mealCard.trainingDay : t.mealCard.restDay}
                    </p>
                    <h3 className="font-display text-2xl font-semibold leading-tight text-white">
                      {t.days[day.name as keyof typeof t.days] ?? day.name}
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
                <p className="text-sm text-mist">{t.hero.targetFuel}</p>
                <span className="tabular text-3xl font-semibold text-white">
                  {cal.toLocaleString()}{" "}
                  <span className="text-base text-mist">{t.hero.kcal}</span>
                </span>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 font-mono text-[0.62rem] font-semibold uppercase tracking-widest ${
                  day.training
                    ? "bg-charge/15 text-volt"
                    : "bg-white/8 text-mist"
                }`}
              >
                {day.training ? t.hero.fuel : t.hero.recover}
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
                  {day.meals.map((meal, idx) => (
                    <div key={idx} className="border-t border-pitch-line pt-3">
                      <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-mist-2">
                        {mealLabels[idx]}
                      </p>
                      <p className="mt-0.5 text-sm text-white/90">
                        {locale === "ar" ? meal.ar : meal.en}
                      </p>
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
              {t.hero.aiGenerated} · {t.hero.day} {i + 1} {t.hero.of} 7
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
