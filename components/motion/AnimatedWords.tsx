"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function AnimatedWords({
  text,
  className,
  startDelay = 0,
  wordDelay = 0.045,
}: {
  text: string;
  className?: string;
  startDelay?: number;
  wordDelay?: number;
}) {
  const words = text.split(" ");
  const nodes: ReactNode[] = [];

  words.forEach((w, i) => {
    if (i > 0) nodes.push(" ");
    nodes.push(
      <motion.span
        key={i}
        className="inline-block"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{
          duration: 0.45,
          delay: startDelay + i * wordDelay,
          ease: "easeOut",
        }}
      >
        {w}
      </motion.span>,
    );
  });

  return <span className={className}>{nodes}</span>;
}
