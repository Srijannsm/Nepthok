"use client";

interface StarsProps {
  value: number;
  count: number;
  size?: "sm" | "md";
}

export function Stars({ value, count, size = "sm" }: StarsProps) {
  const starSize = size === "sm" ? "text-sm" : "text-base";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <span className="inline-flex items-center gap-1">
      <span className={`${starSize} text-yellow-400 leading-none`} aria-hidden>
        ★★★★★
      </span>
      <span className={`${textSize} font-mono font-medium text-gray-800`}>
        {value.toFixed(1)}
      </span>
      <span className={`${textSize} text-gray-400`}>({count})</span>
    </span>
  );
}
