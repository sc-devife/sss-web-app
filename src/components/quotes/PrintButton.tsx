"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="fixed right-6 top-6 rounded-[8px] bg-[#c8ff32] px-4 py-2 text-sm font-bold text-black shadow-lg print:hidden"
    >
      Print / Save as PDF
    </button>
  );
}
