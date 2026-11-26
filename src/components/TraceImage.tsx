"use client";

import React, { useEffect, useRef, useState } from "react";

interface TraceImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  label?: string;
}

export function TraceImage({
  src,
  alt,
  className = "prop-img",
  style,
  priority = false,
  label,
}: TraceImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }
  }, [src]);

  return (
    <>
      {(!loaded || failed) && (
        <div className={`trace-backdrop ${failed ? "is-static" : ""}`} aria-hidden="true">
          <div style={{ display: "grid", placeItems: "center", gap: 4, textAlign: "center", padding: 10 }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path
                d="M6 27V15C6 10.5 11.5 8 16 4C20.5 8 26 10.5 26 15V27"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11 27V18C11 15 13.5 13.5 16 11.5C18.5 13.5 21 15 21 18V27"
                stroke="#F2B705"
                strokeOpacity="0.6"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M4 27H28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {failed && label ? (
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)" }}>{label}</span>
            ) : null}
          </div>
        </div>
      )}
      {!failed && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`${className} trace-img`}
          loading="eager"
          decoding={priority ? "sync" : "auto"}
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={style}
        />
      )}
    </>
  );
}
