"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TbArrowsMaximize, TbArrowsMinimize } from "react-icons/tb";

interface GalleryImageProps {
  src: string;
  alt: string;
  className?: string;
}

// Shared maximize/minimize lightbox for gallery thumbnails — used by the
// Hotel, Escape Point, and Activity detail panels so the interaction (and
// its portal/escape-key/backdrop wiring) lives in one place.
export function GalleryImage({ src, alt, className }: GalleryImageProps) {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!maximized) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMaximized(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [maximized]);

  return (
    <div className="group/gallery relative h-full w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={className} />
      <button
        type="button"
        onClick={() => setMaximized(true)}
        aria-label="Maximize image"
        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/80 group-hover/gallery:opacity-100"
      >
        <TbArrowsMaximize size={13} />
      </button>

      {maximized &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setMaximized(false)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={() => setMaximized(false)}
              aria-label="Minimize image"
              className="fixed right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 sm:right-6 sm:top-6"
            >
              <TbArrowsMinimize size={18} />
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
