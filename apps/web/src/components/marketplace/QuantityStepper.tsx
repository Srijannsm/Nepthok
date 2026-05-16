"use client";

interface QuantityStepperProps {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  size = "sm",
}: QuantityStepperProps) {
  const py = size === "sm" ? "py-1" : "py-2";
  const px = "px-3";
  const textSize = size === "sm" ? "text-sm" : "text-base";

  const decDisabled = value <= min;
  const incDisabled = max !== undefined && value >= max;

  return (
    <div
      className={`inline-flex items-center border border-gray-200 rounded overflow-hidden select-none ${textSize}`}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={decDisabled}
        className={`${py} ${px} font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 border-r border-gray-200`}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span
        className={`${py} ${px} font-mono font-medium text-gray-900 min-w-[2.5rem] text-center`}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
        disabled={incDisabled}
        className={`${py} ${px} font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 border-l border-gray-200`}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
