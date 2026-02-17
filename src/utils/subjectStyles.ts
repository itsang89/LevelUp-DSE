import type { CSSProperties } from "react";
import type { Subject } from "../types";

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const full = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized;

  const numeric = Number.parseInt(full, 16);
  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;
  return [r, g, b];
}

export function getSubjectGradientStyle(subject?: Subject | null): CSSProperties {
  if (!subject) {
    return {
      background: "linear-gradient(135deg, rgba(15,23,42,0.04), #ffffff)",
    };
  }

  const [r, g, b] = hexToRgb(subject.baseColor);
  return {
    background: `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.11), #ffffff)`,
  };
}
