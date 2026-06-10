"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function Loader() {
  const [visible, setVisible] = useState(true);
  const [line, setLine] = useState(0);

  const LINES = [
    "Initializing secure connection...",
    "Loading threat intelligence...",
    "ECS ready.",
  ];

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setLine(i + 1), i * 400 + 300));
    });
    timers.push(setTimeout(() => setVisible(false), 1900));
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center"
        >
          {/* Subtle grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.06]">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="lg" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.5" fill="#ef233c" opacity="0.4" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#lg)" />
            </svg>
          </div>

          {/* Glowing ring behind logo */}
          <div className="relative flex items-center justify-center">
            <motion.div
              className="absolute rounded-full"
              style={{ width: 160, height: 160, background: "radial-gradient(circle, rgba(239,35,60,0.18) 0%, transparent 70%)" }}
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Image
                src="/brand/icon-dark-128px.png"
                alt="ECS"
                width={80}
                height={80}
                priority
                className="relative drop-shadow-[0_0_24px_rgba(239,35,60,0.5)]"
              />
            </motion.div>
          </div>

          {/* Terminal lines */}
          <div className="mt-8 font-mono text-sm space-y-1.5 text-left min-w-[280px]">
            {LINES.slice(0, line).map((l, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={i === LINES.length - 1 ? "text-accent" : "text-white/50"}
              >
                <span className="text-accent/60 mr-2">$</span>{l}
              </motion.p>
            ))}
            {line < LINES.length && (
              <span className="inline-block w-2 h-4 bg-accent animate-pulse ml-4" />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
