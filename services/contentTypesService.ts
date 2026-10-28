/**
 * contentTypesService.ts — the sitemap/list gate for "which content types does this exam
 * have own data for", answered by the DATABASE (owner batch 4, J1b).
 *
 * WHY: app/sitemap.ts gates every content-type sub-page on
 * lib/sectionRegistry.ts#contentTypeHasData(exam, ct), but the exam rows it uses come from
 * getAllExams(), whose LIST_SELECT deliberately OMITS exam_editions.content_modules (the blob
 * is paid for only by the small content-hub candidate set). On the sitemap path the
 * editorial sections therefore always evaluate false — notification, admit-card, result,
 * application, answer-key, cutoff, previous-papers, study-material and news can never be
 * submitted, no matter what the record holds. Only the column-backed `syllabus` survives.
 * The detail route DOES load the blob, so a live, self-canonical sub-page goes unsubmitted.
 *
 * The view public.exam_content_types_with_data (migration 20261028165448) runs the SAME
 * pinned evaluator — public.content_has_data, which is the SQL twin of that TS rule and is
 * held in parity by qa/parity/sitemap-view-parity.test.ts — inside Postgres, and returns one
 * small text[] per exam instead of ~400 jsonb blobs.
 *
 * FALLBACK RULE (owner J1b): this is an optimisation, never a dependency. If the RPC is
 * missing (an environment where the migration has not run) or errors, the caller gets
 * `null` and keeps the previous behaviour — the sitemap still builds, still submits what it
 * submitted before, and the reason is logged ONCE per process rather than per chunk.
 */
import { createServerClient } from "@/lib/supabase/server";

/** PostgREST puts an `in()`-style id list in the REQUEST URL, so a big id set is a rejected
 *  query, not a slow one (~37 bytes per uuid against a ~16 KB header limit — measured when
 *  the 396-id structured-syllabus lookup returned Headers Overflow). Chunk like every other
 *  id-batching reader in this repo. */
const ID_CHUNK = 100;

let warnedOnce = false;

/** Exported for the test: the "log once" latch must be resettable. */
export function resetContentTypeWarning(): void { warnedOnce = false; }

function logOnce(reason: string): void {
  if (warnedOnce) return;
  warnedOnce = true;
  console.warn(
    `[contentTypesService] exam_content_types_with_data unavailable (${reason}); ` +
    `falling back to the client-side contentTypeHasData gate for this process.`,
  );
}

/**
 * exam id -> the content-type URL slugs that exam has own data for.
 * `null` means "unavailable — use the previous behaviour", and is returned for BOTH a
 * missing RPC and a transport error, so a caller can never mistake "no data" for "no
 * content types": an exam genuinely without any still comes back as an empty array.
 */
export async function getContentTypesByExam(
  examIds: readonly string[],
): Promise<Record<string, string[]> | null> {
  const ids = examIds.filter(Boolean);
  if (ids.length === 0) return {};

  const out: Record<string, string[]> = {};
  try {
    const supabase = createServerClient();
    for (let i = 0; i < ids.length; i += ID_CHUNK) {
      const chunk = ids.slice(i, i + ID_CHUNK);
      const { data, error } = await supabase.rpc("exam_content_types_with_data", { exam_ids: chunk });
      if (error) {
        // A missing function (404 / PGRST202) is the expected state in an environment where
        // the migration has not run — the fallback, not an outage. Anything else is a real
        // read failure and is reported the same way, because the previous behaviour is safe.
        logOnce(error.code ? `${error.code}: ${error.message}` : error.message);
        return null;
      }
      for (const row of (data ?? []) as Array<{ exam_id: string; content_types: string[] | null }>) {
        out[row.exam_id] = row.content_types ?? [];
      }
    }
    return out;
  } catch (err) {
    logOnce(err instanceof Error ? err.message : String(err));
    return null;
  }
}
