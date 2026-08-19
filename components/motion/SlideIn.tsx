"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function SlideIn({
  children,
  from = "bottom",
  delay = 0,
  className,
}: {
  children: ReactNode;
  from?: "left" | "right" | "bottom";
  delay?: number;
  className?: string;
}) {
  const x = from === "left" ? -48 : from === "right" ? 48 : 0;
  const y = from === "bottom" ? 32 : 0;
  return (
    <motion.div
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
