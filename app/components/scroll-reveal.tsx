"use client";

import { useEffect, useRef, useState } from "react";

/** Lights words up as the paragraph scrolls through the viewport. Static when motion is reduced. */
export function ScrollReveal({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  const ref = useRef<HTMLParagraphElement>(null);
  const [lit, setLit] = useState(words.length);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const update = () => {
      const { top, height } = el.getBoundingClientRect();
      const progress = (window.innerHeight * 0.85 - top) / (height + window.innerHeight * 0.35);
      setLit(Math.round(Math.min(Math.max(progress, 0), 1) * words.length));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [words.length]);

  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <span key={i} className="transition-opacity duration-300" style={{ opacity: i < lit ? 1 : i === lit ? 0.65 : 0.3 }}>
          {w}{" "}
        </span>
      ))}
    </p>
  );
}
