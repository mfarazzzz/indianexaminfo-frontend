/**
 * E2E-only fixture page (FX3 B2). Renders the client ReportErrorControl with no
 * server data dependency so a Playwright browser test can exercise its submit
 * path against the REAL built client bundle (proving NEXT_PUBLIC_* inlining).
 * Not linked from anywhere in the app; noindex. (Path must NOT start with an
 * underscore — Next treats _-prefixed folders as private and drops the route.)
 */
import { ReportErrorControl } from "@/components/contact/ReportErrorControl";

export const metadata = { robots: { index: false, follow: false } };

export default function E2EReportErrorFixture() {
  return (
    <main>
      <h1>E2E fixture — report an error</h1>
      <ReportErrorControl />
    </main>
  );
}
