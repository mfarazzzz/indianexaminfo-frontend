export const siteConfig = {
  name: "IndianExamInfo",
  tagline: "India's Most Trusted Exam Information Portal",
  url: "https://www.indianexaminfo.com",
  description:
    "Get latest updates on government jobs, entrance exams, board exams and university results. Admit cards, answer keys, syllabus, study material for all Indian competitive exams.",
  keywords: [
    "sarkari naukri",
    "entrance exam",
    "board exam result",
    "admit card",
    "answer key",
    "exam syllabus",
    "upsc",
    "ssc",
    "ibps",
    "neet",
    "jee main",
    "up board",
    "cbse result",
  ],
  locale: "en_IN",
  twitterHandle: "@IndianExamInfo",
  telegramChannel: "https://t.me/indianexaminfo",
  whatsappChannel: "https://whatsapp.com/channel/0029VbDTeFBHQbSBbmHqKg1o",
  whatsappGroup: "https://whatsapp.com/channel/0029VbDTeFBHQbSBbmHqKg1o",
  facebookPage: "https://www.facebook.com/profile.php?id=61592543439991",
  youtubeChannel: "https://www.youtube.com/@IndianExamInfo",
  // E1 (owner batch 8): EMPTY by default, not a placeholder publisher id.
  // A placeholder (`ca-pub-XXXXXXXXXX`) used to be hard-coded here and in
  // components/ads/AdSlot.tsx, which made every ad slot render an <ins> element
  // and a reserved box for an ad network that is not configured. The empty
  // default is the honest "not configured" state: AdSlot renders nothing.
  // Set the real id with NEXT_PUBLIC_ADSENSE_PUBLISHER_ID (or the CMS setting).
  adsense: { publisherId: "" },
  organization: {
    name: "IndianExamInfo Media Pvt Ltd",
    logo: "/icons/logo.png",
    address: {
      "@type": "PostalAddress",
      addressLocality: "New Delhi",
      addressRegion: "Delhi",
      addressCountry: "IN",
    },
  },
} as const;
