// Inline error fallback used by route `errorComponent` so a failed API call
// (or a database that hasn't been seeded yet) shows a friendly empty/error
// state instead of the root "This page didn't load" screen.
export function SectionError({
  error,
  reset,
  title = "Couldn't load this section",
}: {
  error: Error;
  reset: () => void;
  title?: string;
}) {
  const msg = error?.message ?? "";
  const looksLikeNetwork = /network|fetch|failed to|timeout/i.test(msg);
  return (
    <div className="mx-auto my-8 max-w-lg rounded-3xl border border-white/10 bg-surface/60 p-8 text-center backdrop-blur-xl">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {looksLikeNetwork
          ? "We couldn't reach the server. Check your connection and try again."
          : "There's no data yet or the request failed. You can try again."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
      >
        Try again
      </button>
    </div>
  );
}
