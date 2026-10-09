/**
 * A script that runs while the HTML is parsed, before first paint. On the
 * client it renders as inert `text/plain` so React neither re-runs it nor warns
 * about rendering a script; `suppressHydrationWarning` covers the type swap.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
