/**
 * ContentTypeDataRenderer.tsx
 * Renders the structured `contentTypeData` JSON from a content post.
 * Each content type has its own display section. Falls back gracefully
 * when a field is missing — never crashes on partial data.
 */

import { formatDate } from "@/lib/utils";
import { Download, ExternalLink } from "lucide-react";
import type { ContentPost } from "@/types/exam";

type Props = {
  contentType: string;
  data: Record<string, unknown>;
  attachmentUrls?: ContentPost["attachmentUrls"];
};

function val(data: Record<string, unknown>, key: string): string {
  return (data[key] as string) ?? "";
}
function num(data: Record<string, unknown>, key: string): number | null {
  const v = data[key];
  return typeof v === "number" ? v : null;
}
function bool(data: Record<string, unknown>, key: string): boolean {
  return !!(data[key]);
}
function arr<T>(data: Record<string, unknown>, key: string): T[] {
  return Array.isArray(data[key]) ? (data[key] as T[]) : [];
}

// ── Reusable sub-components ──────────────────────────────────────────────

function KeyDateRow({ label, date, isUrgent }: { label: string; date: string; isUrgent?: boolean }) {
  if (!date) return null;
  return (
    <tr>
      <td className="font-medium text-gray-800">{label}</td>
      <td className={`font-mono ${isUrgent ? "text-accent font-semibold" : "text-gray-700"}`}>
        {formatDate(date)}
      </td>
    </tr>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  if (!value && value !== 0) return null;
  return (
    <tr>
      <td className="font-medium text-gray-800">{label}</td>
      <td className="text-gray-700">{value}</td>
    </tr>
  );
}

function SectionTable({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[320px]">
        <caption className="sr-only">{caption}</caption>
        <thead><tr><th scope="col">Event / Item</th><th scope="col">Details</th></tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

// ── Per-type renderers ───────────────────────────────────────────────────

function NotificationData({ d }: { d: Record<string, unknown> }) {
  const hasInfo = val(d, "eligibilitySummary") || num(d, "vacancyCount") || val(d, "applyLink") || val(d, "notificationPdfUrl");
  if (!hasInfo) return null;
  return (
    <section aria-label="Notification details" className="mb-5">
      <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Notification Details</h2>
      <SectionTable caption="Notification key details">
        {num(d, "vacancyCount") !== null && <InfoRow label="Total Vacancies" value={num(d, "vacancyCount")!} />}
        {val(d, "eligibilitySummary") && <InfoRow label="Eligibility" value={val(d, "eligibilitySummary")} />}
      </SectionTable>
      {val(d, "notificationPdfUrl") && (
        <a href={val(d, "notificationPdfUrl")} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-3 bg-red-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-red-700 transition-colors">
          <Download className="w-4 h-4" /> Download Official Notification PDF
        </a>
      )}
    </section>
  );
}

function ApplicationData({ d }: { d: Record<string, unknown> }) {
  const fees = d["fees"] as Record<string, number> | undefined;
  return (
    <>
      {(val(d, "applicationStartDate") || val(d, "applicationEndDate")) && (
        <section aria-label="Application dates" className="mb-5">
          <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Application Dates</h2>
          <SectionTable caption="Application important dates">
            <KeyDateRow label="Application Start"        date={val(d, "applicationStartDate")} />
            <KeyDateRow label="Application End Date"     date={val(d, "applicationEndDate")} isUrgent />
            <KeyDateRow label="Last Date — Fee Payment"  date={val(d, "lastDateFeePayment")} isUrgent />
          </SectionTable>
        </section>
      )}
      {fees && Object.keys(fees).length > 0 && (
        <section aria-label="Application fee" className="mb-5">
          <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Application Fee</h2>
          <div className="overflow-x-auto">
            <table className="min-w-[280px]">
              <caption className="sr-only">Application fee details</caption>
              <thead><tr><th scope="col">Category</th><th scope="col">Fee</th></tr></thead>
              <tbody>
                {fees.general != null && <tr><td>General</td><td>₹{fees.general}</td></tr>}
                {fees.obc != null && fees.obc > 0 && <tr><td>OBC-NCL</td><td>₹{fees.obc}</td></tr>}
                {fees.ews != null && fees.ews > 0 && <tr><td>EWS</td><td>₹{fees.ews}</td></tr>}
                {fees.sc != null && <tr><td>SC / ST / PwBD</td><td>₹{fees.sc}</td></tr>}
                {fees.pwd != null && fees.pwd > 0 && <tr><td>PwBD</td><td>₹{fees.pwd}</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {(val(d, "eligibilitySummary") || val(d, "documentsRequired")) && (
        <section aria-label="Eligibility" className="mb-5">
          <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Eligibility &amp; Documents</h2>
          {val(d, "eligibilitySummary") && <p className="text-sm text-gray-700 mb-2">{val(d, "eligibilitySummary")}</p>}
          {val(d, "documentsRequired") && (
            <>
              <h3 className="font-semibold text-sm text-gray-800 mb-1">Documents Required</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{val(d, "documentsRequired")}</p>
            </>
          )}
        </section>
      )}
      {val(d, "applyOnlineUrl") && (
        <div className="mb-5">
          <a href={val(d, "applyOnlineUrl")} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded text-sm font-semibold hover:bg-primary-600 transition-colors">
            <ExternalLink className="w-4 h-4" /> Apply Online Now
          </a>
        </div>
      )}
    </>
  );
}

function AdmitCardData({ d }: { d: Record<string, unknown> }) {
  return (
    <>
      {(val(d, "admitCardReleaseDate") || val(d, "examDate")) && (
        <section aria-label="Admit card dates" className="mb-5">
          <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Key Dates</h2>
          <SectionTable caption="Admit card dates">
            <KeyDateRow label="Admit Card Release Date" date={val(d, "admitCardReleaseDate")} isUrgent />
            <KeyDateRow label="Exam Date"               date={val(d, "examDate")} />
          </SectionTable>
        </section>
      )}
      {val(d, "credentialsRequired") && (
        <section className="mb-5">
          <h2 className="font-heading font-semibold text-base text-gray-800 mb-2">Login Credentials Required</h2>
          <p className="text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">{val(d, "credentialsRequired")}</p>
        </section>
      )}
      {val(d, "admitCardUrl") && (
        <div className="mb-5">
          <a href={val(d, "admitCardUrl")} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded text-sm font-semibold hover:bg-primary-600 transition-colors">
            <Download className="w-4 h-4" /> Download Admit Card
          </a>
        </div>
      )}
    </>
  );
}

function ResultData({ d }: { d: Record<string, unknown> }) {
  return (
    <>
      {val(d, "resultDeclaredDate") && (
        <section aria-label="Result date" className="mb-5">
          <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Result Date</h2>
          <SectionTable caption="Result dates">
            <KeyDateRow label="Result Declared" date={val(d, "resultDeclaredDate")} />
          </SectionTable>
        </section>
      )}
      {bool(d, "cutoffApplicable") && val(d, "cutoffDetails") && (
        <section aria-label="Cutoff" className="mb-5">
          <h2 className="font-heading font-semibold text-base text-gray-800 mb-2">Cutoff</h2>
          <p className="text-sm text-gray-700 whitespace-pre-line">{val(d, "cutoffDetails")}</p>
        </section>
      )}
      {val(d, "nextSteps") && (
        <section className="mb-5">
          <h2 className="font-heading font-semibold text-base text-gray-800 mb-2">Next Steps</h2>
          <p className="text-sm text-gray-700 whitespace-pre-line">{val(d, "nextSteps")}</p>
        </section>
      )}
      <div className="flex flex-wrap gap-3 mb-5">
        {val(d, "resultUrl") && (
          <a href={val(d, "resultUrl")} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary-600 transition-colors">
            <ExternalLink className="w-4 h-4" /> Check Result
          </a>
        )}
        {val(d, "scoreCardUrl") && (
          <a href={val(d, "scoreCardUrl")} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-slate-800 transition-colors">
            <Download className="w-4 h-4" /> Download Score Card
          </a>
        )}
      </div>
    </>
  );
}

function AnswerKeyData({ d }: { d: Record<string, unknown> }) {
  return (
    <>
      <section className="mb-5">
        <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Answer Key Details</h2>
        <SectionTable caption="Answer key details">
          {val(d, "keyType") && <InfoRow label="Key Type" value={val(d, "keyType") === "provisional" ? "Provisional" : "Final"} />}
          <KeyDateRow label="Challenge Window — Start" date={val(d, "challengeStartDate")} />
          <KeyDateRow label="Challenge Window — End"   date={val(d, "challengeEndDate")} isUrgent />
          {num(d, "objectionFee") !== null && <InfoRow label="Objection Fee" value={`₹${num(d, "objectionFee")}`} />}
        </SectionTable>
      </section>
      <div className="flex flex-wrap gap-3 mb-5">
        {val(d, "answerKeyUrl") && (
          <a href={val(d, "answerKeyUrl")} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary-600 transition-colors">
            <Download className="w-4 h-4" /> Download Answer Key PDF
          </a>
        )}
        {val(d, "challengePortalUrl") && (
          <a href={val(d, "challengePortalUrl")} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-amber-700 transition-colors">
            <ExternalLink className="w-4 h-4" /> Raise Objection
          </a>
        )}
      </div>
    </>
  );
}

function SyllabusData({ d }: { d: Record<string, unknown> }) {
  type SubjectEntry = { name: string; url?: string };
  const subjects = arr<SubjectEntry>(d, "subjects");
  return (
    <>
      {(val(d, "syllabusYear") || val(d, "syllabusVersion") || val(d, "examPattern")) && (
        <section className="mb-5">
          <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Syllabus Info</h2>
          <SectionTable caption="Syllabus info">
            {val(d, "syllabusYear")    && <InfoRow label="Year"           value={val(d, "syllabusYear")} />}
            {val(d, "syllabusVersion") && <InfoRow label="Version"        value={val(d, "syllabusVersion")} />}
            {val(d, "examPattern")     && <InfoRow label="Exam Pattern"   value={val(d, "examPattern")} />}
          </SectionTable>
        </section>
      )}
      {subjects.length > 0 && (
        <section aria-label="Subject-wise syllabus" className="mb-5">
          <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Subject-wise Syllabus</h2>
          <ul className="space-y-1.5">
            {subjects.map((s, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    {s.name} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-gray-700">{s.name}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      {val(d, "syllabusUrl") && (
        <a href={val(d, "syllabusUrl")} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary-600 transition-colors mb-5">
          <Download className="w-4 h-4" /> Download Full Syllabus PDF
        </a>
      )}
    </>
  );
}

function CutoffData({ d }: { d: Record<string, unknown> }) {
  type CutoffRow = { category: string; marks: string };
  const rows = arr<CutoffRow>(d, "categoryWiseCutoff");
  return (
    <>
      {(val(d, "cutoffYear") || val(d, "cutoffType")) && (
        <section className="mb-5">
          <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Cutoff Details</h2>
          <SectionTable caption="Cutoff info">
            {val(d, "cutoffYear") && <InfoRow label="Year"      value={val(d, "cutoffYear")} />}
            {val(d, "cutoffType") && <InfoRow label="Cutoff For" value={val(d, "cutoffType")} />}
          </SectionTable>
        </section>
      )}
      {rows.length > 0 && (
        <section aria-label="Category-wise cutoff" className="mb-5">
          <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Category-wise Cutoff Marks</h2>
          <div className="overflow-x-auto">
            <table className="min-w-[280px]">
              <caption className="sr-only">Category-wise cutoff marks</caption>
              <thead><tr><th scope="col">Category</th><th scope="col">Cutoff Marks</th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}><td className="font-medium text-gray-800">{r.category}</td><td className="text-gray-700">{r.marks}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {val(d, "previousYearCutoff") && (
        <section className="mb-5">
          <h2 className="font-heading font-semibold text-base text-gray-800 mb-2">Previous Year Comparison</h2>
          <p className="text-sm text-gray-700 whitespace-pre-line">{val(d, "previousYearCutoff")}</p>
        </section>
      )}
      {val(d, "cutoffPdfUrl") && (
        <a href={val(d, "cutoffPdfUrl")} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary-600 transition-colors mb-5">
          <Download className="w-4 h-4" /> Download Cutoff PDF
        </a>
      )}
    </>
  );
}

function PreviousPapersData({ d }: { d: Record<string, unknown> }) {
  type Paper = { year: string; title: string; url: string };
  const papers = arr<Paper>(d, "papers");
  if (!papers.length) return null;
  return (
    <section aria-label="Previous papers" className="mb-5">
      <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Previous Year Papers</h2>
      <div className="overflow-x-auto">
        <table className="min-w-[380px]">
          <caption className="sr-only">Previous year question papers</caption>
          <thead><tr><th scope="col">Year</th><th scope="col">Paper</th><th scope="col">Download</th></tr></thead>
          <tbody>
            {papers.map((p, i) => (
              <tr key={i}>
                <td className="font-mono text-gray-700 font-semibold">{p.year}</td>
                <td className="text-gray-800">{p.title}</td>
                <td>
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-semibold">
                      <Download className="w-3.5 h-3.5" /> PDF
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DateSheetData({ d }: { d: Record<string, unknown> }) {
  type ScheduleRow = { date: string; subject: string };
  const schedule = arr<ScheduleRow>(d, "subjectSchedule");
  return (
    <>
      {(val(d, "examStartDate") || val(d, "examEndDate")) && (
        <section className="mb-5">
          <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Exam Schedule</h2>
          <SectionTable caption="Exam schedule dates">
            <KeyDateRow label="Exam Start Date" date={val(d, "examStartDate")} />
            <KeyDateRow label="Exam End Date"   date={val(d, "examEndDate")} />
          </SectionTable>
        </section>
      )}
      {schedule.length > 0 && (
        <section aria-label="Subject schedule" className="mb-5">
          <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Subject-wise Schedule</h2>
          <div className="overflow-x-auto">
            <table className="min-w-[320px]">
              <caption className="sr-only">Date sheet subject schedule</caption>
              <thead><tr><th scope="col">Date</th><th scope="col">Subject / Paper</th></tr></thead>
              <tbody>
                {schedule.map((r, i) => (
                  <tr key={i}>
                    <td className="font-mono text-gray-700">{formatDate(r.date)}</td>
                    <td className="font-medium text-gray-800">{r.subject}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {val(d, "dateSheetUrl") && (
        <a href={val(d, "dateSheetUrl")} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary-600 transition-colors mb-5">
          <Download className="w-4 h-4" /> Download Date Sheet PDF
        </a>
      )}
    </>
  );
}

function AttachmentsSection({ attachments }: { attachments: ContentPost["attachmentUrls"] }) {
  if (!attachments?.length) return null;
  return (
    <section aria-label="Attachments" className="mb-5">
      <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Downloads &amp; Links</h2>
      <div className="flex flex-wrap gap-2">
        {attachments.map((a, i) => (
          <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-3 py-2 rounded text-sm font-semibold transition-colors
              ${a.type === "pdf"
                ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                : a.isOfficial
                ? "bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
              }`}>
            {a.type === "pdf" ? <Download className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
            {a.label}
            {a.type === "pdf" && <span className="text-xs opacity-70">[PDF]</span>}
          </a>
        ))}
      </div>
    </section>
  );
}

// ── Main export ──────────────────────────────────────────────────────────
export function ContentTypeDataRenderer({ contentType, data, attachmentUrls }: Props) {
  if (!data || Object.keys(data).length === 0) return null;

  return (
    <>
      {contentType === "notification"     && <NotificationData  d={data} />}
      {contentType === "application"      && <ApplicationData   d={data} />}
      {contentType === "admit-card"       && <AdmitCardData     d={data} />}
      {contentType === "result"           && <ResultData        d={data} />}
      {contentType === "answer-key"       && <AnswerKeyData     d={data} />}
      {contentType === "syllabus"         && <SyllabusData      d={data} />}
      {contentType === "cutoff"           && <CutoffData        d={data} />}
      {contentType === "previous-papers"  && <PreviousPapersData d={data} />}
      {contentType === "date-sheet"       && <DateSheetData     d={data} />}
      <AttachmentsSection attachments={attachmentUrls} />
    </>
  );
}
