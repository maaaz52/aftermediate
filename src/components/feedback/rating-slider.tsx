"use client";

export function RatingSlider({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-1">
        <span className="text-5xl font-black tabular-nums text-blue-400">{value}</span>
        <span className="text-sm text-faint">/ 10</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Rating out of 10"
        className="w-full accent-blue-500"
      />
      <div className="mt-1 flex justify-between text-xs text-faint">
        <span>not for me</span>
        <span>life-changing</span>
      </div>
    </div>
  );
}
