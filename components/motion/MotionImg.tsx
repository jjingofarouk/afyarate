"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

export function MotionImg(props: HTMLMotionProps<"img">) {
  return (
    <motion.img
      initial={{ scale: 1.1, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1.4, ease: "easeOut" }}
      {...props}
    />
  );
}
