"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="is">
      <body
        style={{
          margin: 0,
          background: "#0F1117",
          color: "#FAFAFA",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>Villa kom upp</h2>
          <p style={{ color: "#A1A1AA", fontSize: 14, marginBottom: 24 }}>
            {error.message || "Óvænt villa kom upp."}
          </p>
          <button
            onClick={reset}
            style={{
              background: "#34D399",
              color: "#09090B",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reyna aftur
          </button>
        </div>
      </body>
    </html>
  );
}
