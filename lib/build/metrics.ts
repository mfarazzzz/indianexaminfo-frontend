/**
 * lib/build/metrics.ts — lightweight counters for the Supabase requests the
 * build makes, so F4 (before/after) has a real number instead of a guess.
 *
 * Counters live on globalThis (per isolate). Next.js runs static generation in
 * worker threads during `next build`, so each worker accumulates its own count
 * and prints a one-line summary on exit; the totals in the report are the sum
 * of those lines. Printing is gated to the production-build phase so normal
 * dev / `next start` / tests never emit it.
 */

type Metrics = {
  requests: number; // total Supabase fetches attempted
  retries: number; // fetches re-attempted after a retryable failure
  printed: boolean;
};

function store(): Metrics {
  const g = globalThis as unknown as { __ieiBuildMetrics?: Metrics };
  return (g.__ieiBuildMetrics ??= { requests: 0, retries: 0, printed: false });
}

export function recordRequest(): void {
  const m = store();
  m.requests += 1;
  // F4 measurement mode: Next terminates build workers with a signal, so an
  // `exit` hook never fires in them and their counts are lost. When
  // BUILD_METRICS_VERBOSE=1 we echo a running total on every request (worker
  // stdout IS forwarded to the build log), so the exact count survives even a
  // killed worker — the last line per pid is that worker's total. Off by
  // default, so normal builds and `next start` stay quiet.
  if (process.env.BUILD_METRICS_VERBOSE === "1") {
    console.log(`[build-metrics] pid=${process.pid} cum=${m.requests} retries=${m.retries}`);
  }
}

export function recordRetry(): void {
  store().retries += 1;
}

export function getMetrics(): Readonly<Metrics> {
  return { ...store() };
}

/** True inside `next build` (production), false in dev / start / vitest. */
function isProductionBuild(): boolean {
  // `next build` sets NODE_ENV=production and a NEXT_PHASE marker; build
  // workers are forked child processes that inherit NODE_ENV but may not carry
  // NEXT_PHASE, so accept either signal. Never fires in dev (development) or
  // vitest (test).
  if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development") return false;
  return Boolean(process.env.NEXT_PHASE) || process.env.NODE_ENV === "production";
}

let hookInstalled = false;

/**
 * Install a once-per-process exit hook that prints the summary. Called lazily
 * from the fetch wrapper's first use; safe to call multiple times.
 */
export function ensureBuildMetricReporter(): void {
  if (hookInstalled) return;
  hookInstalled = true;
  if (!isProductionBuild()) return;
  if (typeof process === "undefined" || typeof process.on !== "function") return;
  process.on("exit", () => {
    const m = store();
    if (m.printed) return;
    m.printed = true;
    // Single, greppable line for the before/after table.
    console.log(
      `[build-metrics] pid=${process.pid} supabaseRequests=${m.requests} retries=${m.retries}`,
    );
  });
}
