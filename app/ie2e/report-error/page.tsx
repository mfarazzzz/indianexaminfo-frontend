/**
 * E2E-only fixture page (FX3 B2). Renders the client ReportErrorControl with no
 * server data dependency so a Playwright browser test can exercise its submit
 * path against the REAL built client bundle (proving NEXT_PUBLIC_* inlining).
 *
 * FX3 pre-push: this route must NOT exist in production. It renders ONLY when
 * E2E === "1" (set in the Playwright webServer build/start env). In any normal
 * `next build` E2E is unset, so the page calls notFound() and is a true 404.
 * The noindex metadata is a second guard. It is not linked from any nav/menu
 * and is not emitted into any sitemap.
 *
 * (Path must NOT start with an underscore — Next treats _-prefixed folders as
 * private and drops the route entirely, which is why this is `ie2e`.)
 */
import { notFound } from "next/navigation";
import { e2eFixtureEnabled } from "@/lib/e2eFixture";
import { ReportErrorControl } from "@/components/contact/ReportErrorControl";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function E2EReportErrorFixture() {
  // True 404 in every normal build; only the Playwright run sets E2E=1.
  if (!e2eFixtureEnabled()) notFound();
  return (
    <main>
      <h1>E2E fixture — report an error</h1>
      <ReportErrorControl />
    </main>
  );
}
