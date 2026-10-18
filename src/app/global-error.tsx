"use client";

/**
 * Last-resort error page when the root layout itself fails. It renders its own document, without
 * the site's styles, so it is styled inline and kept plain.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "system-ui, sans-serif", background: "#050607", color: "#f4f5f6" }}>
        <title>Something went wrong | Riderzpro</title>
        <main style={{ maxWidth: 480, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 28, margin: "0 0 12px" }}>Riderzpro is having a moment.</h1>
          <p style={{ color: "#9aa1aa", lineHeight: 1.5 }}>Please try again in a minute. Your cart is saved in this browser.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{ marginTop: 20, padding: "12px 24px", border: 0, borderRadius: 2, background: "#c81e1e", color: "#fff", fontWeight: 700, cursor: "pointer" }}
          >
            Try again
          </button>
          {error.digest && <p style={{ marginTop: 16, fontSize: 12, color: "#6b7177" }}>Reference: {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
