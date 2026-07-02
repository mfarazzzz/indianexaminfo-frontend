export const navigation = {
  sarkariNaukri: {
    label: "Sarkari Naukri",
    href: "/sarkari-naukri",
    categories: [
      {
        heading: "Civil Services",
        items: [
          { label: "UPSC Civil Services", href: "/sarkari-naukri/upsc/civil-services" },
          { label: "UPSC CDS", href: "/sarkari-naukri/upsc/cds" },
          { label: "UPSC NDA", href: "/sarkari-naukri/upsc/nda" },
          { label: "UPPSC PCS", href: "/sarkari-naukri/state-psc/uppsc-pcs" },
          { label: "BPSC", href: "/sarkari-naukri/state-psc/bpsc" },
          { label: "MPPSC", href: "/sarkari-naukri/state-psc/mppsc" },
        ],
      },
      {
        heading: "Banking & Finance",
        items: [
          { label: "IBPS PO", href: "/sarkari-naukri/banking/ibps-po" },
          { label: "IBPS Clerk", href: "/sarkari-naukri/banking/ibps-clerk" },
          { label: "SBI PO", href: "/sarkari-naukri/banking/sbi-po" },
          { label: "SBI Clerk", href: "/sarkari-naukri/banking/sbi-clerk" },
          { label: "RBI Grade B", href: "/sarkari-naukri/banking/rbi-grade-b" },
          { label: "LIC AAO", href: "/sarkari-naukri/banking/lic-aao" },
        ],
      },
      {
        heading: "SSC & Railways",
        items: [
          { label: "SSC CGL", href: "/sarkari-naukri/ssc/ssc-cgl" },
          { label: "SSC CHSL", href: "/sarkari-naukri/ssc/ssc-chsl" },
          { label: "SSC MTS", href: "/sarkari-naukri/ssc/ssc-mts" },
          { label: "RRB NTPC", href: "/sarkari-naukri/railways/rrb-ntpc" },
          { label: "RRB Group D", href: "/sarkari-naukri/railways/rrb-group-d" },
          { label: "RRB ALP", href: "/sarkari-naukri/railways/rrb-alp" },
        ],
      },
      {
        heading: "Defence & Police",
        items: [
          { label: "Agniveer Army", href: "/sarkari-naukri/defence/agniveer-army" },
          { label: "NDA", href: "/sarkari-naukri/upsc/nda" },
          { label: "AFCAT", href: "/sarkari-naukri/defence/afcat" },
          { label: "UP Police", href: "/sarkari-naukri/police/up-police-constable" },
          { label: "Delhi Police", href: "/sarkari-naukri/police/delhi-police-constable" },
          { label: "CISF Constable", href: "/sarkari-naukri/police/cisf-constable" },
        ],
      },
    ],
  },
  entranceExam: {
    label: "Entrance Exam",
    href: "/entrance-exam",
    categories: [
      {
        heading: "Engineering",
        items: [
          { label: "JEE Main", href: "/entrance-exam/engineering/jee-main" },
          { label: "JEE Advanced", href: "/entrance-exam/engineering/jee-advanced" },
          { label: "BITSAT", href: "/entrance-exam/engineering/bitsat" },
          { label: "VITEEE", href: "/entrance-exam/engineering/viteee" },
          { label: "MHT CET", href: "/entrance-exam/engineering/mht-cet" },
          { label: "WBJEE", href: "/entrance-exam/engineering/wbjee" },
        ],
      },
      {
        heading: "Medical",
        items: [
          { label: "NEET UG", href: "/entrance-exam/medical/neet-ug" },
          { label: "NEET PG", href: "/entrance-exam/medical/neet-pg" },
          { label: "AIIMS PG", href: "/entrance-exam/medical/aiims-pg" },
          { label: "INI CET", href: "/entrance-exam/medical/ini-cet" },
          { label: "JIPMER PG", href: "/entrance-exam/medical/jipmer-pg" },
          { label: "NEET MDS", href: "/entrance-exam/medical/neet-mds" },
        ],
      },
      {
        heading: "Management & Law",
        items: [
          { label: "CAT", href: "/entrance-exam/mba/cat" },
          { label: "XAT", href: "/entrance-exam/mba/xat" },
          { label: "SNAP", href: "/entrance-exam/mba/snap" },
          { label: "CLAT UG", href: "/entrance-exam/law/clat-ug" },
          { label: "AILET", href: "/entrance-exam/law/ailet" },
          { label: "LSAT India", href: "/entrance-exam/law/lsat-india" },
        ],
      },
      {
        heading: "Design & Others",
        items: [
          { label: "NATA", href: "/entrance-exam/design/nata" },
          { label: "NIFT Entrance", href: "/entrance-exam/design/nift" },
          { label: "GATE", href: "/entrance-exam/science-pg/gate" },
          { label: "CUET UG", href: "/entrance-exam/liberal-arts/cuet-ug" },
          { label: "NCHMCT JEE", href: "/entrance-exam/hotel-management/nchmct-jee" },
          { label: "IIMC Entrance", href: "/entrance-exam/media/iimc" },
        ],
      },
    ],
  },
  boardExam: {
    label: "Board Exam",
    href: "/board-exam",
    categories: [
      {
        heading: "Central Boards",
        items: [
          { label: "CBSE Class 10", href: "/board-exam/cbse/class-10" },
          { label: "CBSE Class 12", href: "/board-exam/cbse/class-12" },
          { label: "ICSE (Class 10)", href: "/board-exam/state/cisce/icse-class-10" },
          { label: "ISC (Class 12)", href: "/board-exam/state/cisce/isc-class-12" },
          { label: "NIOS Class 10", href: "/board-exam/state/nios/class-10" },
          { label: "NIOS Class 12", href: "/board-exam/state/nios/class-12" },
        ],
      },
      {
        heading: "State Boards",
        items: [
          { label: "UP Board", href: "/board-exam/state/up-board" },
          { label: "Bihar Board", href: "/board-exam/state/bihar-board" },
          { label: "RBSE Rajasthan", href: "/board-exam/state/rbse" },
          { label: "MPBSE", href: "/board-exam/state/mpbse" },
          { label: "Maharashtra Board", href: "/board-exam/state/maharashtra-board" },
          { label: "More Boards →", href: "/board-exam" },
        ],
      },
      {
        heading: "Universities (UP)",
        items: [
          { label: "MJPRU Bareilly", href: "/board-exam/university/mjpru" },
          { label: "CSJMU Kanpur", href: "/board-exam/university/csjmu" },
          { label: "DBRAU Agra", href: "/board-exam/university/dbrau" },
          { label: "Lucknow University", href: "/board-exam/university/lucknow-university" },
          { label: "VBSPU Jaunpur", href: "/board-exam/university/vbspu" },
          { label: "RMLAU Ayodhya", href: "/board-exam/university/rmlau" },
        ],
      },
      {
        heading: "Central Universities",
        items: [
          { label: "BHU Result", href: "/board-exam/university/bhu" },
          { label: "AMU Result", href: "/board-exam/university/amu" },
          { label: "DU SOL Result", href: "/board-exam/university/du-sol" },
          { label: "IGNOU", href: "/board-exam/university/ignou" },
          { label: "JNU Result", href: "/board-exam/university/jnu" },
          { label: "JMI Result", href: "/board-exam/university/jmi" },
        ],
      },
    ],
  },
  blog: {
    label: "Blog & News",
    href: "/blog",
    sections: [
      { label: "Education News", href: "/blog/education-news" },
      { label: "Exam Preparation", href: "/blog/exam-prep" },
      { label: "Career Guidance", href: "/blog/career-guidance" },
      { label: "Scholarships", href: "/blog/scholarship" },
      { label: "Study Abroad", href: "/blog/study-abroad" },
      { label: "EdTech", href: "/blog/edtech" },
      { label: "Student Life", href: "/blog/student-life" },
      { label: "Opinion", href: "/blog/opinion" },
    ],
  },
  quickLinks: [
    { label: "Admit Card", href: "/admit-card" },
    { label: "Results", href: "/results" },
    { label: "Answer Key", href: "/answer-key" },
    { label: "Syllabus", href: "/syllabus" },
    { label: "Date Sheet", href: "/date-sheet" },
    { label: "Mock Test", href: "/mock-test" },
    { label: "Previous Papers", href: "/previous-papers" },
    { label: "Study Material", href: "/study-material" },
  ],
} as const;
