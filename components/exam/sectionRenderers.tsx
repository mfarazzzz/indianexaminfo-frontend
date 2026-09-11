/**
 * sectionRenderers.tsx — Frontend-only map of section slug → renderer components.
 *
 * The registry (lib/sectionRegistry.ts) is plain DATA (slug, label, placement,
 * order, hasData) shared identically with the CMS. The JSX lives HERE, frontend
 * only. The detail page loops the registry for order/placement and looks up the
 * matching Summary component here.
 *
 * ⚠️ Markup here is MOVED VERBATIM from the pre-rebuild EntityDetailPage sections
 * (Slice 1). No visual change intended — if a section looks different, it's a bug,
 * not a redesign. `Detail` renderers arrive in Slice 2.
 */
import Link from "next/link";
import type { ExamEntity } from "@/types/exam";
import { formatDate } from "@/lib/utils";
import { Calendar } from "lucide-react";

/** A section summary component receives the exam and returns the section JSX (or null). */
export type SectionSummary = (exam: ExamEntity) => React.ReactNode;

// ── Important Dates (column) ──────────────────────────────────────────────────
const ImportantDatesSummary: SectionSummary = (exam) => (
  <section aria-label="Important dates" className="mb-5">
    <h2 className="font-heading font-semibold text-base text-gray-800 mb-3 flex items-center gap-2">
      <Calendar className="w-4 h-4 text-primary" />
      Important Dates
    </h2>
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <table className="min-w-[420px]">
        <caption className="sr-only">Important dates for {exam.name}</caption>
        <thead>
          <tr>
            <th scope="col">Event</th>
            <th scope="col">Date</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {exam.dates.map((d, i) => {
            const isCancelled = d.state === "cancelled";
            const isExpected  = d.state === "expected" || d.state === "tba";
            const isPostponed = d.state === "postponed";
            const isPast = !isCancelled && !isExpected && new Date(d.date) < new Date();

            return (
              <tr key={`${d.label}-${i}`} className={isCancelled ? "opacity-60" : undefined}>
                {/* Event label — struck through when cancelled */}
                <td className={`font-medium ${isCancelled ? "text-gray-400 line-through" : "text-gray-800"}`}>
                  {d.label}
                </td>

                {/* Date cell */}
                <td className={`font-mono ${
                  isCancelled ? "text-gray-400 line-through"
                  : isExpected ? "text-gray-500"
                  : d.isUrgent ? "text-accent font-semibold"
                  : "text-gray-700"
                }`}>
                  {isCancelled ? (
                    <span>{formatDate(d.date)}</span>
                  ) : isExpected ? (
                    <span
                      title="Tentative date — not yet officially confirmed. Check the official website before acting on this."
                      className="cursor-help"
                    >
                      {formatDate(d.date)}{" "}
                      <span className="text-[11px] font-normal not-italic">(expected)</span>
                    </span>
                  ) : (
                    formatDate(d.date)
                  )}
                </td>

                {/* Status chip */}
                <td>
                  {isCancelled ? (
                    <span className="text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                      Cancelled
                    </span>
                  ) : isPostponed ? (
                    <span className="text-xs font-medium text-amber-600">Postponed</span>
                  ) : isExpected ? (
                    <span className="text-xs text-gray-400">Tentative</span>
                  ) : isPast ? (
                    <span className="text-xs text-gray-400">Passed</span>
                  ) : d.isUrgent ? (
                    <span className="text-xs text-accent font-semibold">Urgent</span>
                  ) : (
                    <span className="text-xs text-success">Upcoming</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </section>
);

// ── Eligibility (column) ──────────────────────────────────────────────────────
const EligibilitySummary: SectionSummary = (exam) => {
  if (!exam.eligibility || !Object.values(exam.eligibility).some((v) => v)) return null;
  return (
    <section aria-label="Eligibility criteria" className="mb-5">
      <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Eligibility Criteria</h2>
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="min-w-[320px]">
          <caption className="sr-only">Eligibility for {exam.name}</caption>
          <thead>
            <tr>
              <th scope="col">Criteria</th>
              <th scope="col">Details</th>
            </tr>
          </thead>
          <tbody>
            {exam.eligibility.age && exam.eligibility.age.trim() && (
              <tr><td>Age Limit</td><td>{exam.eligibility.age}</td></tr>
            )}
            {exam.eligibility.qualification && exam.eligibility.qualification.trim() && (
              <tr><td>Educational Qualification</td><td>{exam.eligibility.qualification}</td></tr>
            )}
            {exam.eligibility.nationality && exam.eligibility.nationality.trim() && (
              <tr><td>Nationality</td><td>{exam.eligibility.nationality}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

// ── Application Fee (column) ──────────────────────────────────────────────────
const ApplicationFeeSummary: SectionSummary = (exam) => {
  if (!exam.applicationFee) return null;
  return (
    <section aria-label="Application fee" className="mb-5">
      <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Application Fee</h2>
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="min-w-[280px]">
          <caption className="sr-only">Application fee for {exam.name}</caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Fee Amount</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const fee = exam.applicationFee!;
              const rows: { category: string; amount: number }[] = [];
              if (fee.general != null && fee.general > 0) {
                const cats = ["General"];
                if (fee.obc != null && fee.obc === fee.general) cats.push("OBC");
                if (fee.ews != null && fee.ews === fee.general) cats.push("EWS");
                rows.push({ category: cats.join(" / "), amount: fee.general });
              }
              if (fee.obc != null && fee.obc > 0 && fee.obc !== fee.general) {
                rows.push({ category: "OBC-NCL", amount: fee.obc });
              }
              if (fee.ews != null && fee.ews > 0 && fee.ews !== fee.general) {
                rows.push({ category: "EWS", amount: fee.ews });
              }
              if (fee.sc != null && fee.sc > 0) {
                const cats = ["SC"];
                if (fee.st != null && fee.st === fee.sc) cats.push("ST");
                if (fee.pwd != null && fee.pwd === fee.sc) cats.push("PwBD");
                rows.push({ category: cats.join(" / "), amount: fee.sc });
              }
              if (fee.st != null && fee.st > 0 && fee.st !== fee.sc) {
                rows.push({ category: "ST", amount: fee.st });
              }
              if (fee.pwd != null && fee.pwd > 0 && fee.pwd !== fee.sc) {
                rows.push({ category: "PwBD", amount: fee.pwd! });
              }
              return rows.map((r) => (
                <tr key={r.category}><td>{r.category}</td><td>₹{r.amount.toLocaleString("en-IN")}</td></tr>
              ));
            })()}
          </tbody>
        </table>
      </div>
    </section>
  );
};

// ── Vacancy (column) ──────────────────────────────────────────────────────────
const VacancySummary: SectionSummary = (exam) => {
  if (exam.vacancy == null || exam.vacancy <= 0) return null;
  return (
    <section aria-label="Vacancy details" className="mb-5">
      <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Vacancy Details</h2>
      <p className="text-sm text-gray-700">
        <span className="font-medium">Total Vacancies:</span>{" "}
        {exam.vacancy.toLocaleString("en-IN")}
      </p>
    </section>
  );
};

// ── Selection Process (column) ────────────────────────────────────────────────
const SelectionProcessSummary: SectionSummary = (exam) => {
  if (!exam.selectionProcess || exam.selectionProcess.length === 0) return null;
  return (
    <section aria-label="Selection process" className="mb-5">
      <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Selection Process</h2>
      <ol className="space-y-2">
        {exam.selectionProcess.map((step, i) => (
          <li key={step} className="flex items-start gap-3 text-sm">
            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
              {i + 1}
            </span>
            <span className="text-gray-700 pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
};

// ── FAQs (column: exams.faqs) ─────────────────────────────────────────────────
const FaqsSummary: SectionSummary = (exam) => {
  if (!exam.faqs || exam.faqs.length === 0) return null;
  return (
    <section aria-label="Frequently asked questions" className="mb-5">
      <h2 className="font-heading font-bold text-lg text-gray-900 mb-4">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {exam.faqs.map((faq, i) => (
          <div key={i} className="border border-border rounded p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-2">{faq.question}</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

// ── Editorial sections (overview, application-process, admit-card, result, etc.)
// These read exam.contentModules[slug]. Markup moved verbatim from ContentModulesBlock.
function safeHtml(val: unknown): string | null {
  if (typeof val !== "string" || !val.trim()) return null;
  return val.replace(/^<html[^>]*><body[^>]*>/i, "").replace(/<\/body><\/html>$/i, "").trim();
}
function moduleData(exam: ExamEntity, slug: string): Record<string, unknown> | null {
  const cm = exam.contentModules;
  if (!cm) return null;
  const d = cm[slug];
  return d && typeof d === "object" && !Array.isArray(d) ? (d as Record<string, unknown>) : null;
}

const OverviewSummary: SectionSummary = (exam) => {
  const data = moduleData(exam, "overview");
  if (!data) return null;
  const body = safeHtml(data.body) || safeHtml(data.content);
  const summary = data.summary as string | undefined;
  if (!body && !summary) return null;
  return (
    <section aria-label="About This Exam" className="mb-5">
      <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">About This Exam</h2>
      {summary && <p className="text-sm text-gray-600 mb-3 leading-relaxed">{summary}</p>}
      {body && <div className="article-body text-sm" dangerouslySetInnerHTML={{ __html: body }} />}
    </section>
  );
};

const ApplicationProcessSummary: SectionSummary = (exam) => {
  const data = moduleData(exam, "application-process");
  if (!data) return null;
  const steps = data.steps as { title?: string; description?: string }[] | undefined;
  const description = safeHtml(data.description);
  const fee = safeHtml(data.fee);
  if (!steps?.length && !description) return null;
  return (
    <section aria-label="Application Process" className="mb-5">
      <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Application Process</h2>
      {description && <div className="article-body text-sm mb-4" dangerouslySetInnerHTML={{ __html: description }} />}
      {steps && steps.length > 0 && (
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
              <div>
                {step.title && <p className="font-medium text-gray-800">{step.title}</p>}
                {step.description && <p className="text-gray-600 mt-0.5" dangerouslySetInnerHTML={{ __html: step.description }} />}
              </div>
            </li>
          ))}
        </ol>
      )}
      {fee && (
        <div className="mt-4 p-3 bg-gray-50 rounded border border-border">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Application Fee</p>
          <div className="text-sm" dangerouslySetInnerHTML={{ __html: fee }} />
        </div>
      )}
    </section>
  );
};

/** Generic editorial section (salary, age-limit, admit-card, result, documents, reservation). */
function makeGenericEditorial(slug: string, label: string): SectionSummary {
  return (exam) => {
    const data = moduleData(exam, slug);
    if (!data) return null;
    const body = safeHtml(data.body) || safeHtml(data.content) || safeHtml(data.description);
    const summary = data.summary as string | undefined;
    if (!body && !summary) return null;
    return (
      <section aria-label={label} className="mb-5">
        <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">{label}</h2>
        {summary && <p className="text-sm text-gray-600 mb-3 leading-relaxed">{summary}</p>}
        {body && <div className="article-body text-sm" dangerouslySetInnerHTML={{ __html: body }} />}
      </section>
    );
  };
}

// ── Selection-outcome sections (2026-09-11) ──────────────────────────────────
// Read from content_modules[slug], written by the CMS module editor (saveModuleContent).
// Field keys mirror indianexaminfo-cms/src/config/moduleRegistry.ts exactly.
// These make merit-based / interview-based selection outcomes visible — previously
// recruitment records had no way to show their selection result at all.

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => (typeof v === "number" ? v : null);
const rows = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? v.filter((r) => r && typeof r === "object") as Record<string, unknown>[] : [];

/** Merit List — fields: listType, releaseDate, meritListUrl, totalSelected, verificationDates, reportingVenue */
const MeritListSummary: SectionSummary = (exam) => {
  const d = moduleData(exam, "merit-list");
  if (!d) return null;
  const url = str(d.meritListUrl), releaseDate = str(d.releaseDate);
  if (!url && !releaseDate) return null; // nothing substantive
  const listType = str(d.listType), total = num(d.totalSelected);
  return (
    <section aria-label="Merit List" className="mb-5">
      <h2 className="font-heading font-semibold text-base text-gray-800 mb-2">Merit List</h2>
      <dl className="text-sm text-gray-700 space-y-1">
        {listType && <div><dt className="inline font-medium text-gray-800">Type: </dt><dd className="inline capitalize">{listType}</dd></div>}
        {releaseDate && <div><dt className="inline font-medium text-gray-800">Released: </dt><dd className="inline">{formatDate(releaseDate)}</dd></div>}
        {total != null && <div><dt className="inline font-medium text-gray-800">Total selected: </dt><dd className="inline">{total.toLocaleString("en-IN")}</dd></div>}
        {str(d.verificationDates) && <div><dt className="inline font-medium text-gray-800">Verification: </dt><dd className="inline">{str(d.verificationDates)}</dd></div>}
        {str(d.reportingVenue) && <div><dt className="inline font-medium text-gray-800">Reporting venue: </dt><dd className="inline">{str(d.reportingVenue)}</dd></div>}
      </dl>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 mt-2 text-primary hover:underline text-sm font-medium">
          Download Merit List
        </a>
      )}
    </section>
  );
};

/** Interview Schedule — fields: callLetterDate, callLetterUrl, rounds[{round,date,venue}], marksWeightage, instructions */
const InterviewScheduleSummary: SectionSummary = (exam) => {
  const d = moduleData(exam, "interview-schedule");
  if (!d) return null;
  const callUrl = str(d.callLetterUrl), roundRows = rows(d.rounds);
  if (!callUrl && roundRows.length === 0 && !str(d.callLetterDate)) return null;
  return (
    <section aria-label="Interview Schedule" className="mb-5">
      <h2 className="font-heading font-semibold text-base text-gray-800 mb-2">Interview Schedule</h2>
      {str(d.callLetterDate) && <p className="text-sm text-gray-700 mb-1"><span className="font-medium text-gray-800">Call letter: </span>{formatDate(str(d.callLetterDate)!)}</p>}
      {str(d.marksWeightage) && <p className="text-sm text-gray-700 mb-1"><span className="font-medium text-gray-800">Weightage: </span>{str(d.marksWeightage)}</p>}
      {roundRows.length > 0 && (
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mt-2">
          <table className="min-w-[320px] w-full text-sm">
            <thead><tr className="text-left text-gray-500"><th scope="col" className="py-1 pr-4">Round</th><th scope="col" className="py-1 pr-4">Date</th><th scope="col" className="py-1">Venue</th></tr></thead>
            <tbody>
              {roundRows.map((r, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="py-1.5 pr-4 font-medium text-gray-800">{str(r.round) ?? "—"}</td>
                  <td className="py-1.5 pr-4 text-gray-600">{str(r.date) ? formatDate(str(r.date)!) : "—"}</td>
                  <td className="py-1.5 text-gray-600">{str(r.venue) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {str(d.instructions) && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{str(d.instructions)}</p>}
      {callUrl && (
        <a href={callUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 mt-2 text-primary hover:underline text-sm font-medium">
          Download Interview Call Letter
        </a>
      )}
    </section>
  );
};

/** Document Verification — fields: startDate, endDate, venue, callLetterUrl, documentsRequired[{document,notes}], instructions */
const DocumentVerificationSummary: SectionSummary = (exam) => {
  const d = moduleData(exam, "document-verification");
  if (!d) return null;
  const docRows = rows(d.documentsRequired);
  if (!str(d.startDate) && !str(d.venue) && !str(d.callLetterUrl) && docRows.length === 0) return null;
  return (
    <section aria-label="Document Verification" className="mb-5">
      <h2 className="font-heading font-semibold text-base text-gray-800 mb-2">Document Verification</h2>
      <dl className="text-sm text-gray-700 space-y-1">
        {str(d.startDate) && <div><dt className="inline font-medium text-gray-800">Dates: </dt><dd className="inline">{formatDate(str(d.startDate)!)}{str(d.endDate) ? ` – ${formatDate(str(d.endDate)!)}` : ""}</dd></div>}
        {str(d.venue) && <div><dt className="inline font-medium text-gray-800">Venue: </dt><dd className="inline">{str(d.venue)}</dd></div>}
      </dl>
      {docRows.length > 0 && (
        <div className="mt-2">
          <p className="text-sm font-medium text-gray-800 mb-1">Documents to bring</p>
          <ul className="list-disc pl-4 space-y-0.5 text-sm text-gray-700">
            {docRows.map((r, i) => (
              <li key={i}>{str(r.document) ?? "—"}{str(r.notes) ? <span className="text-gray-500"> — {str(r.notes)}</span> : null}</li>
            ))}
          </ul>
        </div>
      )}
      {str(d.instructions) && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{str(d.instructions)}</p>}
      {str(d.callLetterUrl) && (
        <a href={str(d.callLetterUrl)!} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 mt-2 text-primary hover:underline text-sm font-medium">
          Download DV Call Letter
        </a>
      )}
    </section>
  );
};

/** Final Selection — fields: releaseDate, finalListUrl, totalSelected, joiningDetails */
const FinalSelectionSummary: SectionSummary = (exam) => {
  const d = moduleData(exam, "final-selection");
  if (!d) return null;
  const url = str(d.finalListUrl), releaseDate = str(d.releaseDate);
  if (!url && !releaseDate) return null;
  const total = num(d.totalSelected);
  return (
    <section aria-label="Final Selection" className="mb-5">
      <h2 className="font-heading font-semibold text-base text-gray-800 mb-2">Final Selection</h2>
      <dl className="text-sm text-gray-700 space-y-1">
        {releaseDate && <div><dt className="inline font-medium text-gray-800">Released: </dt><dd className="inline">{formatDate(releaseDate)}</dd></div>}
        {total != null && <div><dt className="inline font-medium text-gray-800">Total selected: </dt><dd className="inline">{total.toLocaleString("en-IN")}</dd></div>}
        {str(d.joiningDetails) && <div><dt className="inline font-medium text-gray-800">Joining: </dt><dd className="inline">{str(d.joiningDetails)}</dd></div>}
      </dl>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 mt-2 text-primary hover:underline text-sm font-medium">
          Download Final Selection List
        </a>
      )}
    </section>
  );
};

/** Seat Allotment — fields: rounds[{round,allotmentDate,reportingLastDate}], allotmentResultUrl, seatMatrixUrl, acceptanceProcess */
const SeatAllotmentSummary: SectionSummary = (exam) => {
  const d = moduleData(exam, "seat-allotment");
  if (!d) return null;
  const roundRows = rows(d.rounds), url = str(d.allotmentResultUrl);
  if (roundRows.length === 0 && !url && !str(d.acceptanceProcess)) return null;
  return (
    <section aria-label="Seat Allotment" className="mb-5">
      <h2 className="font-heading font-semibold text-base text-gray-800 mb-2">Seat Allotment</h2>
      {roundRows.length > 0 && (
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="min-w-[320px] w-full text-sm">
            <thead><tr className="text-left text-gray-500"><th scope="col" className="py-1 pr-4">Round</th><th scope="col" className="py-1 pr-4">Allotment</th><th scope="col" className="py-1">Reporting by</th></tr></thead>
            <tbody>
              {roundRows.map((r, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="py-1.5 pr-4 font-medium text-gray-800">{str(r.round) ?? "—"}</td>
                  <td className="py-1.5 pr-4 text-gray-600">{str(r.allotmentDate) ? formatDate(str(r.allotmentDate)!) : "—"}</td>
                  <td className="py-1.5 text-gray-600">{str(r.reportingLastDate) ? formatDate(str(r.reportingLastDate)!) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {str(d.acceptanceProcess) && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{str(d.acceptanceProcess)}</p>}
      <div className="flex flex-wrap gap-3 mt-2">
        {url && <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="text-primary hover:underline text-sm font-medium">Allotment Result</a>}
        {str(d.seatMatrixUrl) && <a href={str(d.seatMatrixUrl)!} target="_blank" rel="noopener noreferrer nofollow" className="text-primary hover:underline text-sm font-medium">Seat Matrix</a>}
      </div>
    </section>
  );
};

/**
 * slug → Summary renderer. The detail page loops the registry (order/placement)
 * and calls the renderer here. Sections with no entry render nothing.
 */
export const SECTION_SUMMARY_RENDERERS: Record<string, SectionSummary> = {
  // key-highlights removed — each fact now has its own ordered section below
  overview: OverviewSummary,
  "important-dates": ImportantDatesSummary,
  eligibility: EligibilitySummary,
  "application-fee": ApplicationFeeSummary,
  vacancy: VacancySummary,
  "application-process": ApplicationProcessSummary,
  "selection-process": SelectionProcessSummary,
  salary: makeGenericEditorial("salary", "Salary & Pay Scale"),
  "age-limit": makeGenericEditorial("age-limit", "Age Limit"),
  "admit-card": makeGenericEditorial("admit-card", "Admit Card"),
  result: makeGenericEditorial("result", "Result"),
  "documents-required": makeGenericEditorial("documents-required", "Documents Required"),
  reservation: makeGenericEditorial("reservation", "Reservation Policy"),
  faqs: FaqsSummary,
  // Selection-outcome sections (content_modules-backed)
  "merit-list": MeritListSummary,
  "interview-schedule": InterviewScheduleSummary,
  "document-verification": DocumentVerificationSummary,
  "final-selection": FinalSelectionSummary,
  "seat-allotment": SeatAllotmentSummary,
};
