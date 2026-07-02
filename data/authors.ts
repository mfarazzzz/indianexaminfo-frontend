import type { BlogAuthor } from "@/types/blog";

export const authors: BlogAuthor[] = [
  {
    id: "author-1",
    slug: "priya-sharma",
    name: "Priya Sharma",
    designation: "Senior Exam Analyst & UPSC Mentor",
    avatar: "/images/authors/priya-sharma.jpg",
    bio: "Priya Sharma has 8+ years of experience covering UPSC, SSC, and state PSC examinations. She holds an MA in Public Administration from Delhi University and has mentored over 500 IAS aspirants. Her analysis is featured in leading education portals.",
    totalPosts: 145,
    specialization: ["UPSC", "State PSC", "Administrative Services", "Current Affairs"],
    socialLinks: {
      twitter: "https://twitter.com/priyasharma_ias",
      linkedin: "https://linkedin.com/in/priya-sharma-edu",
    },
  },
  {
    id: "author-2",
    slug: "rahul-verma",
    name: "Rahul Verma",
    designation: "Banking & Finance Exam Specialist",
    avatar: "/images/authors/rahul-verma.jpg",
    bio: "Rahul Verma is a former bank officer (SBI PO) turned education journalist. He covers IBPS, SBI, RBI and insurance sector recruitment with deep insider knowledge of the banking sector. MBA in Finance from XLRI.",
    totalPosts: 112,
    specialization: ["IBPS", "SBI", "RBI", "Banking Exams", "Insurance Exams"],
    socialLinks: {
      twitter: "https://twitter.com/rahulverma_bank",
      linkedin: "https://linkedin.com/in/rahul-verma-banking",
    },
  },
  {
    id: "author-3",
    slug: "anita-mishra",
    name: "Anita Mishra",
    designation: "Medical & Science Entrance Expert",
    avatar: "/images/authors/anita-mishra.jpg",
    bio: "Dr. Anita Mishra has an MBBS from KGMU Lucknow and transitioned to education content creation. She specialises in NEET UG/PG, medical entrance examinations, and science career guidance. Her NEET preparation guides have helped thousands of students.",
    totalPosts: 98,
    specialization: ["NEET UG", "NEET PG", "Medical Entrances", "AIIMS", "Career in Medicine"],
    socialLinks: {
      twitter: "https://twitter.com/dranita_neet",
      linkedin: "https://linkedin.com/in/anita-mishra-medical",
    },
  },
  {
    id: "author-4",
    slug: "amit-singh",
    name: "Amit Singh",
    designation: "Board Exams & University Results Correspondent",
    avatar: "/images/authors/amit-singh.jpg",
    bio: "Amit Singh tracks board examinations across all Indian states with a special focus on UP Board, Bihar Board, and CBSE. He has 6 years of experience covering academic result news and university examination schedules. B.Ed from BHU.",
    totalPosts: 87,
    specialization: ["CBSE", "UP Board", "Bihar Board", "University Results", "State Boards"],
    socialLinks: {
      linkedin: "https://linkedin.com/in/amit-singh-boards",
    },
  },
  {
    id: "author-5",
    slug: "kavita-rao",
    name: "Kavita Rao",
    designation: "Career Counsellor & Study Abroad Advisor",
    avatar: "/images/authors/kavita-rao.jpg",
    bio: "Kavita Rao is a certified career counsellor with expertise in study abroad admissions, scholarship applications, and career planning for Indian students. She has guided 1000+ students for GRE, IELTS, TOEFL and international MBA admissions.",
    totalPosts: 73,
    specialization: ["Study Abroad", "Scholarships", "GRE", "IELTS", "Career Counselling"],
    socialLinks: {
      twitter: "https://twitter.com/kavitarao_edu",
      linkedin: "https://linkedin.com/in/kavita-rao-counsellor",
    },
  },
];
