"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "./StarIcon";

/** Interactive 1–5 star picker for the rating form. */
export default function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <motion.button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          whileHover={{ scale: 1.2, rotate: -6 }}
          whileTap={{ scale: 0.85, rotate: 0 }}
          animate={{ scale: value === n ? [1, 1.3, 1] : 1 }}
          transition={{ duration: 0.25 }}
          className={n <= shown ? "text-amber-400" : "text-slate-300 dark:text-slate-700"}
        >
          <Star size={30} filled={n <= shown} />
        </motion.button>
      ))}
      <span className="ml-2 text-sm font-medium text-slate-600 dark:text-slate-400">
        {shown ? `${shown} / 5` : "Tap to rate"}
      </span>
    </div>
  );
}
