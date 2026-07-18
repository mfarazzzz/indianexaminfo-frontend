import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/config/site";
import { BookOpen, FileText, ClipboardList, HelpCircle, Award, Users, Calculator, GraduationCap, Download, ScrollText, Briefcase } from "lucide-react";

export const revalidate = 86400; // 1 day — this page is mostly static

export const metadata: Metadata = buildExamMetadata({
  pageType: "hub",
  title: "Resources — Syllabus, Exam Pattern, Previous Papers, Mock Tests",
  description: "Complete exam preparation resources: syllabus, exam pattern, previous year papers, mock tests, books, eligibility, selection process, salary details, and counselling information.",
  canonicalUrl: `${siteConfig.url}/resources`,
});

const resources = [
  { label: "Syllabus", description: "Subject-wise syllabus for all major exams", href: "/syllabus", icon: BookOpen, color: "bg-blue-50 text-blue-600 border-blue-200" },
  { label: "Exam Pattern", description: "Marking scheme, duration, question types", href: "/resources", icon: FileText, color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
  { label: "Previous Papers", description: "Year-wise question papers with solutions", href: "/previous-papers", icon: ScrollText, color: "bg-purple-50 text-purple-600 border-purple-200" },
  { label: "Mock Tests", description: "Free online mock tests for practice", href: "/mock-test", icon: ClipboardList, color: "bg-teal-50 text-teal-600 border-teal-200" },
  { label: "Study Material", description: "Notes, PDFs, and video resources", href: "/study-material", icon: Download, color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  { label: "Eligibility", description: "Age limit, qualification, nationality", href: "/resources", icon: HelpCircle, color: "bg-amber-50 text-amber-600 border-amber-200" },
  { label: "Selection Process", description: "Exam stages, interview, document verification", href: "/resources", icon: Users, color: "bg-cyan-50 text-cyan-600 border-cyan-200" },
  { label: "Cut Off", description: "Category-wise cutoff marks and trends", href: "/results", icon: Calculator, color: "bg-rose-50 text-rose-600 border-rose-200" },
  { label: "Salary & Pay Scale", description: "Post-wise salary, allowances, perks", href: "/resources", icon: Briefcase, color: "bg-green-50 text-green-600 border-green-200" },
  { label: "Counselling", description: "Seat allotment, choice filling, reporting", href: "/resources", icon: GraduationCap, color: "bg-violet-50 text-violet-600 border-violet-200" },
  { label: "Preparation Strategy", description: "Expert tips, study plans, toppers' advice", href: "/blog/exam-prep", icon: Award, color: "bg-orange-50 text-orange-600 border-orange-200" },
];

export default function ResourcesPage() {
  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[{ name: "Resources", href: "/resources" }]} />

      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading font-bold text-2xl text-gray-900 mb-2">
          Exam Preparation Resources
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Everything you need to prepare for government exams, entrance exams, and board exams — all in one place.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((res) => {
            const Icon = res.icon;
            return (
              <Link
                key={res.label}
                href={res.href}
                className={`flex items-start gap-3 p-4 rounded-lg border ${res.color} hover:shadow-md transition-all group`}
              >
                <div className="shrink-0 mt-0.5">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm text-gray-900 group-hover:text-primary transition-colors">
                    {res.label}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">{res.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
