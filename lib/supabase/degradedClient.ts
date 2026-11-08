/**
 * lib/supabase/degradedClient.ts — the client wrapper that applies the CI build
 * degrade (owner batch 8, E2a). See lib/build/dbDegrade.ts for the policy.
 *
 * The wrap is a thin proxy over the Supabase client. It changes NOTHING about
 * how a query is built or sent; it only inspects the ANSWER:
 *
 *   • a query that failed (supabase-js resolves — it does not reject — with
 *     `{ error, data: null }` for a network failure) is turned into the empty
 *     answer the same query would give against an empty table, but ONLY while
 *     the CI build flag is on (lib/build/dbDegrade.ts).
 *   • a query that succeeded is passed through untouched, byte for byte.
 *
 * Why a proxy and not a change in each service: the K4 rule ("a failed read is
 * not an empty answer") is asserted service by service in
 * services/readFailure.test.ts, and it must keep holding in production. The
 * services are therefore left alone; the exception lives here, in one place,
 * and it cannot be reached without the documented CI flag.
 */
import { dbDegradeActive, degradeReadResult } from "@/lib/build/dbDegrade";

type Kind = "list" | "single" | "rpc";

/** Chain state shared by every proxy of one query. */
interface ChainState {
  kind: Kind;
}

/**
 * Wrap one PostgREST query builder.
 *
 * `single` / `maybeSingle` flip the chain to the "single" kind so the empty
 * answer is `null` (no such row) instead of `[]` (an empty list).
 */
function wrapBuilder<T extends object>(builder: T, state: ChainState): T {
  return new Proxy(builder, {
    get(target, prop, receiver) {
      if (prop === "single" || prop === "maybeSingle") {
        state.kind = "single";
        const original = Reflect.get(target, prop, target) as (...args: unknown[]) => unknown;
        return (...args: unknown[]) => {
          const next = original.apply(target, args);
          return next && typeof next === "object" ? wrapBuilder(next as object, state) : next;
        };
      }
      if (prop === "then") {
        // The await protocol: resolve with the real answer, degraded only when
        // the CI build flag is on. The builder's `then` reads `this.schema`,
        // `this.headers` and `this.fetch`, so it MUST keep its receiver.
        const original = (Reflect.get(target, prop, target) as (
          onFulfilled?: (value: unknown) => unknown,
          onRejected?: (reason: unknown) => unknown,
        ) => unknown).bind(target);
        return (onFulfilled?: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) =>
          original(
            (value: unknown) =>
              onFulfilled ? onFulfilled(degradeReadResult(value as never, state.kind)) : value,
            onRejected,
          );
      }
      const value = Reflect.get(target, prop, target);
      if (typeof value !== "function") return value;
      return (...args: unknown[]) => {
        const next = (value as (...a: unknown[]) => unknown).apply(target, args);
        // A builder method returns the builder (chainable) or a plain value.
        if (next && typeof next === "object" && typeof (next as { then?: unknown }).then === "function") {
          return wrapBuilder(next as object, state);
        }
        return next;
      };
    },
  }) as T;
}

/**
 * Wrap a Supabase client so every server-side read it makes can degrade to an
 * empty answer during the CI build. A no-op outside the CI build.
 */
export function degradeClient<T extends object>(client: T): T {
  if (!dbDegradeActive()) return client;
  return new Proxy(client, {
    get(target, prop) {
      if (prop === "from" || prop === "rpc") {
        const original = Reflect.get(target, prop, target) as (...args: unknown[]) => unknown;
        return (...args: unknown[]) => {
          const builder = original.apply(target, args);
          const state: ChainState = { kind: prop === "rpc" ? "rpc" : "list" };
          return builder && typeof builder === "object" ? wrapBuilder(builder as object, state) : builder;
        };
      }
      const value = Reflect.get(target, prop, target);
      if (typeof value === "function") return value.bind(target);
      return value;
    },
  }) as T;
}
