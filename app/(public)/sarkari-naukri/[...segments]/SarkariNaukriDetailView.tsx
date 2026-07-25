import Link from "next/link";
import type { SarkariNaukriItem } from "@/services/sarkariNaukriService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";

type Props = {
  item: SarkariNaukriItem;
  slug: string;
};

export function SarkariNaukriDetailView({ item, slug }: Props) {
  const isExam = item.recruitmentType === "exam";

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[
        { name: "Sarkari Naukri", href: "/sarkari-naukri" },
        { name: isExam ? "Sarkari Exam" : "Sarkari Bharti", href: isExam ? "/sarkari-naukri/exam" : "/sarkari-naukri/bharti" },
        { name: item.title, href: `/sarkari-naukri/${slug}` },
      ]} />

      <div className="flex justify-center mb-4">
        <AdSlot position="detail-top" size="728x90" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <main>
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isExam ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                {isExam ? "📝 Sarkari Exam" : "📋 Sarkari Bharti"}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                item.status === "result-declared" ? "bg-emerald-100 text-emerald-700" :
                item.status === "application-open" ? "bg-green-100 text-green-700" :
                item.status === "completed" ? "bg-gray-100 text-gray-600" :
                "bg-blue-100 text-blue-700"
              }`}>
                {item.status.replace(/-/g, " ")}
              </span>
              {item.isNew && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">NEW</span>}
            </div>
            <h1 className="font-heading font-bold text-2xl text-gray-900 mb-2">{item.title}</h1>
            {item.titleHindi && <p className="text-base text-gray-600 mb-2">{item.titleHindi}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
              <span>🏢 {item.organization}</span>
              {item.state && item.state !== "all-india" && <span className="capitalize">📍 {item.state.replace(/-/g, " ")}</span>}
              {item.state === "all-india" && <span>🇮🇳 All India</span>}
              {item.vacancyCount && <span>👥 {item.vacancyCount.toLocaleString("en-IN")} vacancies</span>}
              {item.category && <span className="capitalize">🏷️ {item.category.replace(/-/g, " ")}</span>}
            </div>
          </div>

          {/* Quick Info Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
            <div className="bg-gray-50 px-4 py-2 border-b border-border">
              <h2 className="font-heading font-semibold text-sm text-gray-800">Quick Information</h2>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                <tr><td className="px-4 py-2.5 text-gray-500 w-40">Organization</td><td className="px-4 py-2.5 font-medium text-gray-900">{item.organization}</td></tr>
                {item.department && <tr><td className="px-4 py-2.5 text-gray-500">Department</td><td className="px-4 py-2.5 text-gray-900">{item.department}</td></tr>}
                {item.vacancyCount && <tr><td className="px-4 py-2.5 text-gray-500">Total Vacancies</td><td className="px-4 py-2.5 font-semibold text-gray-900">{item.vacancyCount.toLocaleString("en-IN")}</td></tr>}
                {item.eligibility && <tr><td className="px-4 py-2.5 text-gray-500">Eligibility</td><td className="px-4 py-2.5 text-gray-900">{item.eligibility}</td></tr>}
                {item.ageLimit && <tr><td className="px-4 py-2.5 text-gray-500">Age Limit</td><td className="px-4 py-2.5 text-gray-900">{item.ageLimit}</td></tr>}
                {item.payScale && <tr><td className="px-4 py-2.5 text-gray-500">Salary / Pay Scale</td><td className="px-4 py-2.5 text-gray-900">{item.payScale}</td></tr>}
                {isExam && item.examMode && <tr><td className="px-4 py-2.5 text-gray-500">Exam Mode</td><td className="px-4 py-2.5 text-gray-900 capitalize">{item.examMode}</td></tr>}
                {item.cutoffMarks && <tr><td className="px-4 py-2.5 text-gray-500">Cutoff Marks</td><td className="px-4 py-2.5 text-gray-900">{item.cutoffMarks}</td></tr>}
                {item.totalCandidates && <tr><td className="px-4 py-2.5 text-gray-500">Total Candidates</td><td className="px-4 py-2.5 text-gray-900">{item.totalCandidates.toLocaleString("en-IN")}</td></tr>}
                {item.passPercentage && <tr><td className="px-4 py-2.5 text-gray-500">Pass Percentage</td><td className="px-4 py-2.5 text-gray-900">{item.passPercentage}%</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Important Dates */}
          <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
            <div className="bg-gray-50 px-4 py-2 border-b border-border">
              <h2 className="font-heading font-semibold text-sm text-gray-800">Important Dates</h2>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {item.notificationDate && <tr><td className="px-4 py-2.5 text-gray-500 w-48">Notification Date</td><td className="px-4 py-2.5 text-gray-900">{new Date(item.notificationDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td></tr>}
                {item.applicationStartDate && <tr><td className="px-4 py-2.5 text-gray-500">Application Start</td><td className="px-4 py-2.5 text-gray-900">{new Date(item.applicationStartDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td></tr>}
                {item.applicationEndDate && <tr><td className="px-4 py-2.5 text-gray-500">Application End</td><td className="px-4 py-2.5 font-semibold text-red-600">{new Date(item.applicationEndDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td></tr>}
                {isExam && item.examDate && <tr><td className="px-4 py-2.5 text-gray-500">Exam Date</td><td className="px-4 py-2.5 text-gray-900">{new Date(item.examDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td></tr>}
                {isExam && item.admitCardDate && <tr><td className="px-4 py-2.5 text-gray-500">Admit Card Date</td><td className="px-4 py-2.5 text-gray-900">{new Date(item.admitCardDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td></tr>}
                {isExam && item.answerKeyDate && <tr><td className="px-4 py-2.5 text-gray-500">Answer Key Date</td><td className="px-4 py-2.5 text-gray-900">{new Date(item.answerKeyDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td></tr>}
                {item.resultDate && <tr><td className="px-4 py-2.5 text-gray-500">{isExam ? "Result Date" : "Outcome Date"}</td><td className="px-4 py-2.5 font-semibold text-green-700">{new Date(item.resultDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td></tr>}
                {!isExam && item.interviewDate && <tr><td className="px-4 py-2.5 text-gray-500">Interview Date</td><td className="px-4 py-2.5 text-gray-900">{new Date(item.interviewDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td></tr>}
                {!isExam && item.documentVerificationDate && <tr><td className="px-4 py-2.5 text-gray-500">Document Verification</td><td className="px-4 py-2.5 text-gray-900">{new Date(item.documentVerificationDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td></tr>}
                {!isExam && item.meritListDate && <tr><td className="px-4 py-2.5 text-gray-500">Merit List Date</td><td className="px-4 py-2.5 text-gray-900">{new Date(item.meritListDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Important Links */}
          <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
            <div className="bg-gray-50 px-4 py-2 border-b border-border">
              <h2 className="font-heading font-semibold text-sm text-gray-800">Important Links</h2>
            </div>
            <div className="p-4 flex flex-wrap gap-3">
              {item.applicationUrl && (
                <a href={item.applicationUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors">
                  Apply Online →
                </a>
              )}
              {item.resultUrl && (
                <a href={item.resultUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                  {isExam ? "Check Result →" : "View Merit List →"}
                </a>
              )}
              {item.officialNotificationUrl && (
                <a href={item.officialNotificationUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded border border-border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Official Notification
                </a>
              )}
              {isExam && item.admitCardUrl && (
                <a href={item.admitCardUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded border border-purple-200 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors">
                  Download Admit Card
                </a>
              )}
              {!isExam && item.meritListUrl && (
                <a href={item.meritListUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded border border-teal-200 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50 transition-colors">
                  Download Merit List
                </a>
              )}
            </div>
          </div>

          {/* Description/Content */}
          {item.description && (
            <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
              <div className="bg-gray-50 px-4 py-2 border-b border-border">
                <h2 className="font-heading font-semibold text-sm text-gray-800">Details</h2>
              </div>
              <div
                className="p-4 prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: item.description }}
              />
            </div>
          )}

          {/* Walk-in details for direct */}
          {!isExam && (item.walkInDate || item.walkInVenue || item.joiningDetails) && (
            <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
              <div className="bg-gray-50 px-4 py-2 border-b border-border">
                <h2 className="font-heading font-semibold text-sm text-gray-800">Walk-In / Joining Details</h2>
              </div>
              <div className="p-4 text-sm space-y-2">
                {item.walkInDate && <p><strong>Walk-In Date:</strong> {new Date(item.walkInDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>}
                {item.walkInVenue && <p><strong>Venue:</strong> {item.walkInVenue}</p>}
                {item.joiningDetails && <p><strong>Joining:</strong> {item.joiningDetails}</p>}
              </div>
            </div>
          )}
        </main>

        <aside className="flex flex-col gap-4">
          <AdSlot position="detail-sidebar" size="300x250" />
          <div className="bg-card border border-border rounded p-4">
            <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 uppercase tracking-wide">Related</h2>
            <ul className="space-y-1.5 text-sm">
              {item.state && item.state !== "all-india" && (
                <li><Link href={`/sarkari-naukri/state/${item.state}`} className="text-gray-700 hover:text-primary hover:underline capitalize">More jobs in {item.state.replace(/-/g, " ")}</Link></li>
              )}
              {item.category && (
                <li><Link href={`/sarkari-naukri/${isExam ? "exam" : "bharti"}?category=${item.category}`} className="text-gray-700 hover:text-primary hover:underline capitalize">More {item.category.replace(/-/g, " ")} jobs</Link></li>
              )}
              <li><Link href="/sarkari-naukri" className="text-gray-700 hover:text-primary hover:underline">All Government Jobs</Link></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
