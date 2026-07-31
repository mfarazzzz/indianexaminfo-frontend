import type { ContentType, Pillar } from "@/types/exam";
import type { BlogSection } from "@/types/blog";

// ─────────────────────────────────────────────────
// 1A. GLOBAL SHORT-TAIL SEEDS
// ─────────────────────────────────────────────────
export const GLOBAL_SHORT_TAIL: string[] = [
  "sarkari result", "sarkari naukri", "admit card", "exam", "result",
  "answer key", "syllabus", "exam date", "notification", "recruitment",
  "government job", "sarkari job", "application form", "hall ticket",
  "merit list", "cut off", "vacancy", "date sheet", "time table", "exam pattern",
];

// ─────────────────────────────────────────────────
// 1B. PILLAR-LEVEL KEYWORD SETS
// ─────────────────────────────────────────────────
export const PILLAR_KEYWORDS: Record<Pillar, string[]> = {
  "sarkari-naukri": [
    "sarkari naukri", "sarkari result", "govt job",
    "government job 2027", "sarkari job 2027",
    "10th pass govt job", "12th pass govt job",
    "graduate govt job", "latest govt job",
    "sarkari naukri 2027 apply online",
    "latest government job notification 2027",
    "sarkari result 2027 check online",
    "government job for graduates in india 2027",
    "central government job vacancy 2027",
    "state government job notification 2027",
    "sarkari naukri for 10th pass 2027",
    "sarkari naukri up bihar rajasthan 2027",
    "upcoming government job exam 2027",
    "free job alert government job 2027",
    "govt job without exam 2027 india",
  ],
  "entrance-exam": [
    "entrance exam", "admission 2027",
    "college admission", "university admission",
    "entrance test", "competitive exam",
    "entrance exam 2027 notification apply online",
    "top entrance exam india 2027",
    "entrance exam after 12th 2027",
    "entrance exam for engineering medical law",
    "national level entrance exam 2027",
    "state level entrance exam 2027",
    "entrance exam syllabus exam pattern 2027",
    "how to prepare for entrance exam 2027",
    "entrance exam admit card download 2027",
    "entrance exam result 2027 check online",
  ],
  "board-exam": [
    "board result", "university result",
    "exam result 2027", "marksheet download",
    "date sheet 2027", "time table 2027",
    "board exam", "annual exam",
    "board exam result 2027 check online",
    "university exam date sheet 2027",
    "10th board result 2027",
    "12th board result 2027",
    "university admit card download 2027",
    "revaluation form university exam 2027",
    "board exam sample paper 2027 pdf",
    "university exam scheme 2027",
    "back paper exam result 2027",
    "improvement exam form 2027",
  ],
};

// ─────────────────────────────────────────────────
// 1C. EXAM-SPECIFIC KEYWORD MAP
// ─────────────────────────────────────────────────
export type ExamKeywordEntry = {
  shortTail: string[];
  longTail: string[];
  lsi: string[];
  questions: string[];
  local: string[];
};

export const EXAM_KEYWORDS: Record<string, ExamKeywordEntry> = {
  // ── UPSC ──────────────────────────────────────
  upsc: {
    shortTail: ["upsc", "upsc 2027", "ias exam", "civil services",
      "upsc notification", "upsc syllabus", "upsc result", "upsc admit card", "ias preparation"],
    longTail: [
      "upsc civil services exam 2027 notification",
      "upsc cse 2027 application form date",
      "upsc prelims 2027 exam date syllabus",
      "upsc mains 2027 date pattern marks",
      "upsc result 2027 final list pdf",
      "upsc cut off 2027 category wise",
      "upsc admit card 2027 download link",
      "upsc previous year question paper pdf",
      "upsc age limit eligibility 2027",
      "upsc vacancy 2027 total post",
      "upsc topper interview strategy marks",
      "how to clear upsc in first attempt",
      "best books for upsc cse 2027",
      "upsc mock test series free 2027",
    ],
    lsi: ["ias ips ifs selection", "daf form", "lbsnaa training", "upsc calendar",
      "civil services examination", "csat paper 2", "general studies paper 1 2 3 4",
      "essay paper upsc", "optional subject marks", "personality test interview",
      "rank list", "upsc notification pdf"],
    questions: [
      "what is upsc exam 2027", "when is upsc prelims 2027",
      "how many attempts in upsc", "upsc age limit for obc sc st",
      "what is salary of ias officer 2027", "upsc prelims cut off 2027",
      "how to start upsc preparation from zero",
      "is upsc exam conducted every year",
    ],
    local: ["upsc coaching delhi", "upsc coaching allahabad",
      "upsc preparation in hindi", "up state upsc topper 2027"],
  },

  // ── SSC ───────────────────────────────────────
  ssc: {
    shortTail: ["ssc", "ssc cgl", "ssc chsl", "ssc mts",
      "ssc gd", "ssc result", "ssc admit card", "ssc notification 2027"],
    longTail: [
      "ssc cgl 2027 notification apply online",
      "ssc cgl tier 1 exam date 2027",
      "ssc cgl result 2027 cut off marks",
      "ssc chsl 2027 eligibility salary",
      "ssc gd constable 2027 vacancy",
      "ssc mts 2027 apply online last date",
      "ssc cpo si 2027 notification date",
      "ssc je 2027 paper 1 2 syllabus",
      "ssc cgl admit card 2027 download",
      "ssc cgl previous year paper pdf",
      "ssc cgl mock test 2027 free",
      "ssc cgl post list salary grade pay",
    ],
    lsi: ["staff selection commission", "tier 1 tier 2 tier 3", "cgl mains",
      "combined graduate level", "combined higher secondary level",
      "multitasking staff", "group b c", "ssc calendar 2027 26"],
    questions: [
      "what is ssc cgl exam", "ssc cgl salary after selection 2027",
      "ssc cgl age limit 2027", "how many attempts in ssc cgl",
      "ssc cgl vs ibps po which is better",
      "ssc cgl cut off 2027 general obc",
      "is there negative marking in ssc cgl",
    ],
    local: ["ssc coaching mukherjee nagar",
      "ssc preparation in hindi medium", "ssc cgl up state candidates"],
  },

  // ── IBPS PO ───────────────────────────────────
  "ibps-po": {
    shortTail: ["ibps po", "ibps po 2027", "ibps po admit card",
      "ibps po result", "ibps po syllabus", "bank po"],
    longTail: [
      "ibps po 2027 notification apply online",
      "ibps po 2027 exam date prelims mains",
      "ibps po admit card 2027 download hall ticket",
      "ibps po result 2027 cut off marks",
      "ibps po salary 2027 in hand",
      "ibps po eligibility 2027 age qualification",
      "ibps po vacancy 2027 state wise",
      "ibps po syllabus 2027 pdf prelims mains",
      "ibps po previous year paper pdf",
      "ibps po mock test 2027 free online",
      "ibps po vs sbi po difference salary",
      "how to crack ibps po in first attempt",
      "ibps po cut off 2027 obc sc st",
    ],
    lsi: ["probationary officer", "banking exam", "banking awareness",
      "computer aptitude", "reasoning ability english language",
      "quantitative aptitude", "data analysis", "descriptive test letter essay"],
    questions: [
      "what is ibps po exam 2027", "ibps po salary per month",
      "ibps po age limit 2027", "how many attempts in ibps po",
      "ibps po cut off 2027 state wise",
      "when will ibps po 2027 notification come",
    ],
    local: ["ibps po coaching in delhi", "ibps po preparation in hindi"],
  },

  // ── SBI PO ────────────────────────────────────
  "sbi-po": {
    shortTail: ["sbi po", "sbi po 2027", "sbi po admit card",
      "sbi po result", "sbi probationary officer"],
    longTail: [
      "sbi po 2027 notification apply online",
      "sbi po 2027 exam date prelims mains",
      "sbi po admit card 2027 download",
      "sbi po result 2027 cut off",
      "sbi po salary 2027 per month",
      "sbi po eligibility 2027",
      "sbi po vacancy 2027 total post",
      "sbi po previous year paper pdf solved",
      "sbi po syllabus 2027 exam pattern",
      "sbi po gd interview process 2027",
    ],
    lsi: ["state bank of india po", "sbi clerk", "sbi so specialist officer",
      "sbi apprentice", "sbi junior associate"],
    questions: [
      "sbi po salary in hand 2027",
      "sbi po vs ibps po which is better",
      "sbi po age limit 2027",
      "when will sbi po 2027 notification release",
    ],
    local: ["sbi po coaching delhi mumbai"],
  },

  // ── NEET UG ───────────────────────────────────
  "neet-ug": {
    shortTail: ["neet", "neet 2027", "neet ug", "neet admit card",
      "neet result", "neet cut off", "neet syllabus",
      "mbbs admission", "neet score card", "neet answer key", "neet registration"],
    longTail: [
      "neet 2027 exam date notification",
      "neet ug 2027 apply online registration",
      "neet admit card 2027 download link nta",
      "neet result 2027 check by roll number",
      "neet cut off 2027 category wise general obc",
      "neet syllabus 2027 pdf chapter wise",
      "neet answer key 2027 set wise pdf",
      "neet previous year paper 2024 2023 pdf",
      "mbbs admission 2027 through neet",
      "neet score card 2027 download",
      "neet ug counselling 2027 state wise",
      "neet 2027 expected cut off marks",
      "top medical college neet cut off 2027",
      "neet mock test 2027 free nta",
      "neet preparation tips 2027 topper",
      "neet eligibility 2027 age attempts",
      "bhu mbbs admission 2027 neet score",
    ],
    lsi: ["national eligibility cum entrance test", "nta neet", "medical entrance",
      "mbbs bds bams bhms admission", "medical college india",
      "biology chemistry physics", "neet ss pg", "fmge",
      "ug counselling mcc", "state counselling neet", "deemed university neet"],
    questions: [
      "what is neet exam 2027", "neet 2027 exam date",
      "neet cut off for mbbs 2027", "how many attempts allowed in neet",
      "neet age limit 2027", "neet syllabus 2027 reduced or same",
      "which state has lowest neet cut off",
      "neet score required for government college",
      "can i get mbbs with 400 marks in neet",
      "neet 2027 total seats mbbs india",
    ],
    local: ["neet coaching kota rajasthan", "neet coaching delhi",
      "neet preparation in hindi medium",
      "up state neet counselling 2027", "bihar neet state quota 2027"],
  },

  // ── JEE MAIN ──────────────────────────────────
  "jee-main": {
    shortTail: ["jee main", "jee main 2027", "jee main admit card",
      "jee main result", "jee main cut off", "jee main syllabus",
      "jee main answer key", "jee main registration", "iit jee", "nit admission"],
    longTail: [
      "jee main 2027 session 1 2 exam date",
      "jee main 2027 apply online nta registration",
      "jee main admit card 2027 download session 1",
      "jee main result 2027 nta score check",
      "jee main cut off 2027 nit iit",
      "jee main syllabus 2027 reduced pdf",
      "jee main answer key 2027 official nta",
      "jee main previous year paper pdf solved",
      "jee main mock test 2027 nta free",
      "jee main eligibility 2027 attempts",
      "jee main score required for nit 2027",
      "jee main percentile vs marks 2027",
      "jee advanced 2027 registration eligibility",
      "jee main preparation strategy 2027",
      "jee main rank predictor 2027",
    ],
    lsi: ["joint entrance examination", "nta jee", "iit nit iiit gfti",
      "b tech admission", "engineering entrance",
      "physics chemistry mathematics", "josaa counselling",
      "csab counselling", "home state quota", "all india quota"],
    questions: [
      "jee main 2027 exam date session 1",
      "jee main cut off 2027 for nit",
      "how many attempts in jee main",
      "jee main age limit 2027",
      "jee main syllabus 2027 changed or not",
      "jee main score for iit admission",
      "is ncert enough for jee main 2027",
      "jee main best books 2027",
    ],
    local: ["jee coaching kota", "jee coaching delhi",
      "jee main preparation in hindi", "up state jee counselling 2027"],
  },

  // ── IGNOU ─────────────────────────────────────
  ignou: {
    shortTail: ["ignou", "ignou result", "ignou admit card",
      "ignou date sheet", "ignou assignment", "ignou admission",
      "ignou exam", "ignou tee", "ignou grade card"],
    longTail: [
      "ignou tee june 2027 date sheet pdf",
      "ignou tee december 2027 exam schedule",
      "ignou admit card june 2027 download",
      "ignou result 2027 check by enrollment",
      "ignou grade card 2027 download",
      "ignou assignment 2027 submission last date",
      "ignou re registration 2027 january july",
      "ignou fresh admission 2027 january session",
      "ignou exam form 2027 tee apply online",
      "ignou study material 2027 free pdf",
      "ignou project submission 2027 guide",
      "ignou ba ma bed mba admission 2027",
      "ignou how to check result 2027",
      "ignou solved assignment 2027 free pdf",
      "ignou admission last date 2027",
    ],
    lsi: ["indira gandhi national open university", "open distance learning",
      "distance education", "correspondence course",
      "term end examination", "grade card marksheet",
      "enrollment number", "study centre", "ignou helpline"],
    questions: [
      "ignou tee june 2027 date sheet kab aayegi",
      "ignou result 2027 kaise check kare",
      "ignou admit card download 2027",
      "ignou assignment last date 2027",
      "ignou admission 2027 last date",
      "ignou exam fees 2027",
      "is ignou degree valid for government job",
      "ignou ba admission 2027",
    ],
    local: ["ignou regional centre lucknow", "ignou regional centre delhi",
      "ignou study centre bareilly rampur",
      "ignou up state admission 2027"],
  },

  // ── UP BOARD ──────────────────────────────────
  "up-board": {
    shortTail: ["up board", "up board result", "up board admit card",
      "up board time table", "up board 10th", "up board 12th", "upmsp", "up board exam"],
    longTail: [
      "up board result 2027 check by roll number",
      "up board 10th result 2027 name wise",
      "up board 12th result 2027 marksheet",
      "up board time table 2027 class 10 12",
      "up board admit card 2027 download",
      "up board exam date 2027 schedule",
      "up board model paper 2027 pdf download",
      "up board sample paper 2027 solution",
      "up board private form 2027 apply",
      "up board compartment result 2027",
      "up board topper 2027 list district wise",
      "up board high school result 2027",
    ],
    lsi: ["madhyamik shiksha parishad", "upmsp allahabad",
      "high school intermediate", "up pariksha result", "up board marksheet"],
    questions: [
      "up board result 2027 kab aayega",
      "up board time table 2027 kab aayega",
      "up board 10th 12th admit card 2027",
      "up board private form last date 2027",
      "up board topper 2027 name",
    ],
    local: ["up board result district wise 2027",
      "up board lucknow allahabad result 2027"],
  },

  // ── CBSE ──────────────────────────────────────
  cbse: {
    shortTail: ["cbse", "cbse result", "cbse admit card",
      "cbse date sheet", "cbse 10th", "cbse 12th",
      "cbse sample paper", "cbse syllabus"],
    longTail: [
      "cbse 10th result 2027 check by roll number",
      "cbse 12th result 2027 marksheet download",
      "cbse date sheet 2027 class 10 12",
      "cbse admit card 2027 download link",
      "cbse sample paper 2027 pdf with solution",
      "cbse previous year paper 2024 class 10 12",
      "cbse syllabus 2027 26 reduced pdf",
      "cbse board exam 2027 date schedule",
      "cbse compartment result 2027",
      "cbse improvement exam form 2027",
      "cbse private candidate form 2027",
    ],
    lsi: ["central board secondary education", "ncert textbook",
      "cbse affiliated school", "board exam class 10 12",
      "digilocker marksheet", "cbse pariksha sangam"],
    questions: [
      "cbse result 2027 kab aayega",
      "cbse date sheet 2027 kab aayegi",
      "cbse 10th 12th admit card 2027",
      "cbse sample paper 2027 pdf kaise download kare",
      "cbse board exam date 2027",
    ],
    local: ["cbse schools delhi up result 2027"],
  },

  // ── BIHAR BOARD ───────────────────────────────
  "bihar-board": {
    shortTail: ["bihar board", "bihar board result", "bseb result",
      "bihar board 10th", "bihar board 12th",
      "bihar board admit card", "bseb", "bihar board time table"],
    longTail: [
      "bihar board matric result 2027 check online",
      "bihar board inter result 2027 name wise",
      "bseb 10th result 2027 roll number",
      "bseb 12th result 2027 marksheet download",
      "bihar board time table 2027 class 10 12",
      "bihar board admit card 2027 download",
      "bihar board dummy admit card 2027",
      "bihar board model paper 2027 pdf",
      "bihar board topper 2027 list",
      "bihar board compartment exam 2027",
    ],
    lsi: ["bihar school examination board", "bseb patna",
      "matric intermediate", "bihar board marksheet verification"],
    questions: [
      "bihar board result 2027 kab aayega",
      "bihar board 10th 12th admit card 2027",
      "bseb time table 2027 kab aayegi",
      "bihar board topper 2027 kaun hai",
    ],
    local: ["bihar board result district wise 2027",
      "patna muzaffarpur result 2027"],
  },

  // ── MJPRU ─────────────────────────────────────
  mjpru: {
    shortTail: ["mjpru", "mjpru result", "mjpru admit card",
      "mjpru date sheet", "rohilkhand university", "mjpru bareilly"],
    longTail: [
      "mjpru result 2027 ba bsc bcom ma",
      "mjpru ba 1st 2nd 3rd year result 2027",
      "mjpru date sheet 2027 pdf download",
      "mjpru admit card 2027 download",
      "mjpru private form 2027 apply online",
      "mjpru back paper result 2027",
      "mjpru improvement form 2027",
      "mjpru revaluation form 2027",
      "mjpru exam date 2027 schedule",
      "mahatma jyotiba phule rohilkhand university",
      "mjpru result 2027 kaise check kare",
      "mjpru bareilly result ba part 1 2 3",
    ],
    lsi: ["mjpru bareilly university", "rohilkhand vishwavidyalaya",
      "ba bsc bcom ma msc mcom", "annual exam semester",
      "private regular candidate"],
    questions: [
      "mjpru result 2027 kab aayega",
      "mjpru date sheet 2027 kab aayegi",
      "mjpru admit card kaise download kare",
      "mjpru back paper form 2027",
      "mjpru private form kaise bhare 2027",
    ],
    local: ["mjpru bareilly rampur moradabad result",
      "rohilkhand university affiliated college"],
  },

  // ── RRB NTPC ──────────────────────────────────
  "rrb-ntpc": {
    shortTail: ["rrb ntpc", "rrb ntpc 2027", "railway ntpc",
      "ntpc admit card", "ntpc result", "ntpc notification"],
    longTail: [
      "rrb ntpc 2027 notification apply online",
      "rrb ntpc 2027 exam date cbt 1 cbt 2",
      "rrb ntpc admit card 2027 download",
      "rrb ntpc result 2027 cut off",
      "rrb ntpc vacancy 2027 post wise",
      "rrb ntpc syllabus 2027 pdf",
      "rrb ntpc previous year paper pdf",
      "rrb ntpc salary 2027 post wise",
      "rrb ntpc eligibility 2027",
      "rrb ntpc mock test 2027 free",
    ],
    lsi: ["railway recruitment board", "non technical popular",
      "junior clerk typist", "station master", "goods guard",
      "cbt 1 cbt 2 cbat"],
    questions: [
      "rrb ntpc 2027 notification kab aayegi",
      "rrb ntpc salary 2027",
      "rrb ntpc age limit 2027",
      "rrb ntpc vs rrb group d which is better",
    ],
    local: ["rrb ntpc allahabad gorakhpur zone"],
  },

  // ── CLAT ──────────────────────────────────────
  clat: {
    shortTail: ["clat", "clat 2027", "clat admit card",
      "clat result", "clat cut off", "clat syllabus",
      "law admission", "nlu admission", "clat registration"],
    longTail: [
      "clat 2027 notification apply online",
      "clat 2027 exam date schedule",
      "clat admit card 2027 download",
      "clat result 2027 cut off marks",
      "clat cut off 2027 nlu wise",
      "clat syllabus 2027 pdf section wise",
      "clat previous year paper pdf solved",
      "clat mock test 2027 free",
      "nlu admission 2027 through clat",
      "clat ug pg 2027 difference",
      "top nlu clat cut off 2027",
    ],
    lsi: ["consortium of national law universities", "five year llb integrated",
      "legal reasoning current affairs", "logical reasoning",
      "nlu ranking"],
    questions: [
      "clat 2027 exam date",
      "clat cut off for nlsiu 2027",
      "clat eligibility marks 2027",
      "how to prepare for clat 2027",
      "clat vs ailet which is better",
    ],
    local: ["clat coaching delhi allahabad"],
  },

  // ── CAT ───────────────────────────────────────
  cat: {
    shortTail: ["cat exam", "cat 2027", "cat admit card",
      "cat result", "cat cut off", "cat syllabus",
      "iim admission", "mba admission", "cat registration"],
    longTail: [
      "cat 2027 notification registration date",
      "cat 2027 exam date schedule",
      "cat admit card 2027 download iim",
      "cat result 2027 percentile score",
      "cat cut off 2027 iim abc",
      "cat syllabus 2027 varc dilr qa",
      "cat previous year paper 2024 2023 pdf",
      "cat mock test 2027 free",
      "iim admission 2027 through cat score",
      "cat percentile required for iim a b c",
    ],
    lsi: ["common admission test", "iim ahmedabad",
      "iim bangalore calcutta", "pgdm mba",
      "varc dilr quantitative ability", "iim selection process gdpi"],
    questions: [
      "cat 2027 exam date",
      "cat cut off for iim a 2027",
      "cat eligibility percentage 2027",
      "how to prepare for cat in 6 months",
      "cat score vs percentile 2027",
    ],
    local: ["cat coaching delhi"],
  },

  // ── UPPSC ─────────────────────────────────────
  uppsc: {
    shortTail: ["uppsc", "uppsc pcs", "uppsc result",
      "uppsc admit card", "uppsc notification", "uppsc syllabus", "up pcs"],
    longTail: [
      "uppsc pcs 2027 notification apply online",
      "uppsc pcs prelims 2027 exam date",
      "uppsc admit card 2027 download",
      "uppsc result 2027 cut off",
      "uppsc pcs salary 2027 post list",
      "uppsc ro aro 2027 notification",
      "uppsc pcs eligibility 2027",
      "uppsc pcs preparation strategy 2027",
    ],
    lsi: ["uttar pradesh public service commission",
      "sdm dsp bdo cdpo", "provincial civil service",
      "up state exam", "allahabad psc"],
    questions: [
      "uppsc pcs 2027 notification kab aayegi",
      "uppsc pcs salary 2027",
      "uppsc pcs age limit 2027",
      "uppsc vs upsc which is harder",
    ],
    local: ["uppsc coaching allahabad lucknow",
      "uppsc result up district wise"],
  },

  // ── UP POLICE ─────────────────────────────────
  "up-police": {
    shortTail: ["up police", "up police result", "up police admit card",
      "up police constable", "up police si", "uppbpb"],
    longTail: [
      "up police constable 2027 notification",
      "up police constable admit card 2027 download",
      "up police result 2027 cut off marks",
      "up police si 2027 notification apply",
      "up police constable salary 2027",
      "up police eligibility 2027 height weight",
      "up police constable previous paper pdf",
      "up police physical test pst pet 2027",
    ],
    lsi: ["uttar pradesh police recruitment board", "uppbpb constable",
      "physical standard test", "physical efficiency", "written exam 2 shifts"],
    questions: [
      "up police constable 2027 kab aayega",
      "up police salary 2027",
      "up police height weight 2027",
      "up police constable cut off 2027",
    ],
    local: ["up police result zone wise agra lucknow"],
  },

  // ── GATE ──────────────────────────────────────
  gate: {
    shortTail: ["gate", "gate 2027", "gate admit card",
      "gate result", "gate cut off", "gate syllabus",
      "gate score card", "psu through gate"],
    longTail: [
      "gate 2027 notification registration date",
      "gate 2027 exam date schedule cs me ce",
      "gate admit card 2027 download",
      "gate result 2027 score card download",
      "gate cut off 2027 psu iit nit",
      "gate syllabus 2027 cs ece me ce pdf",
      "gate previous year paper pdf solved",
      "psu recruitment through gate 2027",
      "gate score validity m tech admission",
      "iit m tech admission gate 2027",
      "gate score for psu ntpc bhel ongc",
    ],
    lsi: ["graduate aptitude test engineering", "iit iisc gate",
      "m tech admission", "general aptitude",
      "gate score card validity 3 years"],
    questions: [
      "gate 2027 exam date",
      "gate cut off for iit 2027",
      "gate score for psu 2027",
      "how many attempts in gate",
      "gate vs upsc which is better",
    ],
    local: ["gate coaching delhi kota"],
  },

  // ── CTET ──────────────────────────────────────
  ctet: {
    shortTail: ["ctet", "ctet 2027", "ctet admit card",
      "ctet result", "ctet syllabus", "ctet notification",
      "ctet certificate", "teacher eligibility test"],
    longTail: [
      "ctet 2027 notification apply online",
      "ctet 2027 exam date july december",
      "ctet admit card 2027 download",
      "ctet result 2027 cut off pass marks",
      "ctet syllabus 2027 paper 1 2 pdf",
      "ctet previous year paper pdf solved",
      "ctet eligibility 2027 qualification",
      "ctet certificate validity lifetime",
      "ctet cut off 2027 general sc st obc",
      "how to prepare for ctet 2027",
    ],
    lsi: ["central teacher eligibility test", "paper 1 primary 1 5",
      "paper 2 upper primary 6 8", "child development pedagogy",
      "kvs nvs dsssb teacher"],
    questions: [
      "ctet 2027 exam date",
      "ctet cut off 2027 general",
      "ctet certificate validity 2027",
      "ctet eligibility 2027",
      "ctet vs uptet difference",
    ],
    local: ["ctet coaching delhi up"],
  },
};

// ─────────────────────────────────────────────────
// 1D. CONTENT TYPE KEYWORD TEMPLATES
// ─────────────────────────────────────────────────
export type ContentTypeKeywordEntry = {
  suffixes: string[];
  longTailTemplates: string[];
  actionWords: string[];
};

export const CONTENT_TYPE_KEYWORDS: Record<ContentType, ContentTypeKeywordEntry> = {
  "admit-card": {
    suffixes: ["admit card", "hall ticket", "call letter",
      "admit card download", "admit card 2027"],
    longTailTemplates: [
      "{exam} admit card 2027 download link",
      "{exam} hall ticket 2027 official website",
      "{exam} admit card release date 2027",
      "how to download {exam} admit card 2027",
      "{exam} call letter download 2027",
      "{exam} admit card name correction 2027",
      "direct link {exam} admit card 2027",
    ],
    actionWords: ["download", "check", "direct link", "official link", "active link now"],
  },
  result: {
    suffixes: ["result", "result 2027", "result check",
      "marksheet", "score card", "merit list", "sarkari result"],
    longTailTemplates: [
      "{exam} result 2027 check online",
      "{exam} result 2027 roll number wise",
      "{exam} result 2027 name wise",
      "{exam} marksheet download 2027",
      "{exam} score card 2027 download",
      "{exam} merit list 2027 pdf",
      "{exam} cut off marks result 2027",
      "{exam} result kaise check kare 2027",
      "direct link {exam} result 2027",
    ],
    actionWords: ["check now", "direct link", "download",
      "name wise", "roll number wise", "pdf"],
  },
  "answer-key": {
    suffixes: ["answer key", "answer key 2027", "official answer key",
      "provisional answer key", "final answer key", "set wise answer key"],
    longTailTemplates: [
      "{exam} answer key 2027 official pdf",
      "{exam} answer key set a b c d 2027",
      "{exam} provisional answer key 2027",
      "{exam} final answer key 2027 download",
      "{exam} answer key objection 2027",
      "how to challenge {exam} answer key 2027",
      "direct link {exam} answer key 2027",
    ],
    actionWords: ["download pdf", "set wise", "official",
      "challenge objection", "direct link"],
  },
  syllabus: {
    suffixes: ["syllabus", "syllabus 2027", "syllabus pdf",
      "exam pattern", "marking scheme", "topic wise syllabus", "new syllabus"],
    longTailTemplates: [
      "{exam} syllabus 2027 pdf download",
      "{exam} syllabus 2027 topic wise",
      "{exam} exam pattern 2027 marks",
      "{exam} new syllabus 2027 changes",
      "{exam} subject wise syllabus 2027",
      "{exam} marking scheme 2027",
      "{exam} important topics 2027",
      "{exam} syllabus in hindi 2027",
    ],
    actionWords: ["pdf download", "topic wise", "subject wise",
      "marking scheme", "chapter wise"],
  },
  "date-sheet": {
    suffixes: ["date sheet", "time table", "exam schedule",
      "date sheet 2027", "time table 2027", "exam date", "exam calendar"],
    longTailTemplates: [
      "{exam} date sheet 2027 pdf download",
      "{exam} time table 2027 subject wise",
      "{exam} exam date 2027 schedule",
      "{exam} date sheet 2027 download link",
      "{exam} exam calendar 2027",
      "{exam} practical date sheet 2027",
    ],
    actionWords: ["pdf download", "subject wise", "official schedule", "direct link"],
  },
  cutoff: {
    suffixes: ["cut off", "cutoff 2027", "cut off marks",
      "expected cut off", "previous year cut off", "category wise cut off"],
    longTailTemplates: [
      "{exam} cut off 2027 general obc sc st",
      "{exam} expected cut off 2027",
      "{exam} previous year cut off 2024 2023",
      "{exam} minimum marks to qualify 2027",
      "{exam} category wise cut off 2027",
      "{exam} state wise cut off 2027",
    ],
    actionWords: ["category wise", "state wise", "previous year", "expected", "official"],
  },
  "previous-papers": {
    suffixes: ["previous year paper", "old paper", "pyq",
      "question paper", "solved paper", "past paper", "previous paper pdf"],
    longTailTemplates: [
      "{exam} previous year question paper pdf",
      "{exam} last 10 year paper pdf download",
      "{exam} solved paper 2024 2023 2022",
      "{exam} shift wise paper 2027",
      "{exam} memory based paper 2027",
      "{exam} practice paper pdf free download",
    ],
    actionWords: ["pdf download", "solved", "free", "shift wise", "year wise"],
  },
  "mock-test": {
    suffixes: ["mock test", "practice test", "online test",
      "test series", "free mock test", "mock test 2027"],
    longTailTemplates: [
      "{exam} free mock test 2027 online",
      "{exam} mock test series 2027",
      "{exam} practice set 2027 pdf",
      "{exam} online test 2027 free",
      "{exam} full length mock test 2027",
      "{exam} topic wise mock test 2027",
    ],
    actionWords: ["free", "online", "full length", "topic wise", "attempt now"],
  },
  "study-material": {
    suffixes: ["study material", "notes", "pdf notes",
      "study notes", "short notes", "chapter wise notes", "free study material"],
    longTailTemplates: [
      "{exam} study material 2027 free pdf",
      "{exam} notes pdf download 2027",
      "{exam} chapter wise notes 2027",
      "{exam} short notes 2027 pdf",
      "{exam} important points 2027",
      "{exam} formula sheet 2027 pdf",
      "{exam} study material in hindi 2027",
    ],
    actionWords: ["free pdf", "download", "chapter wise", "in hindi"],
  },
  notification: {
    suffixes: ["notification", "notification 2027", "official notification",
      "recruitment notification", "notification pdf", "latest notification"],
    longTailTemplates: [
      "{exam} notification 2027 apply online",
      "{exam} official notification pdf 2027",
      "{exam} notification release date 2027",
      "{exam} recruitment 2027 notification",
      "{exam} latest notification 2027",
      "{exam} notification eligibility vacancy",
    ],
    actionWords: ["apply online", "pdf download", "official", "latest", "direct link"],
  },
  application: {
    suffixes: ["apply online", "application form", "registration",
      "online form", "application last date"],
    longTailTemplates: [
      "{exam} apply online 2027 last date",
      "{exam} application form 2027 direct link",
      "{exam} registration 2027 steps",
      "how to fill {exam} application form 2027",
      "{exam} application fee 2027 category wise",
      "{exam} application status check 2027",
    ],
    actionWords: ["apply now", "direct link", "last date", "step by step"],
  },
  books: {
    suffixes: ["best books", "recommended books", "books 2027",
      "book list", "which book for", "free pdf books"],
    longTailTemplates: [
      "best books for {exam} 2027",
      "{exam} recommended books list 2027",
      "{exam} book list subject wise 2027",
      "which book is best for {exam} 2027",
      "{exam} study material books free pdf",
    ],
    actionWords: ["best", "recommended", "subject wise", "arihant lucent ncert"],
  },
};

// ─────────────────────────────────────────────────
// 1E. BLOG SECTION KEYWORDS
// ─────────────────────────────────────────────────
export const BLOG_SECTION_KEYWORDS: Record<BlogSection, string[]> = {
  "education-news": [
    "education news india 2027", "latest education news today",
    "ugc aicte news 2027", "nta latest news 2027",
    "cbse board news 2027", "education policy news india",
    "exam news today 2027", "university news india 2027",
  ],
  "exam-prep": [
    "exam preparation tips 2027", "how to prepare for competitive exam",
    "study tips for government exam", "exam strategy 2027",
    "topper tips tricks 2027", "competitive exam preparation guide",
    "how to crack exam in first attempt", "study plan for exam 2027",
    "time management exam preparation",
  ],
  "career-guidance": [
    "career guidance after 12th", "career options india 2027",
    "best career after graduation", "government job career path",
    "career counselling india", "which course to choose after 12th",
    "career in government sector india", "career after btech bsc ba",
  ],
  scholarship: [
    "scholarship 2027 india apply", "government scholarship 2027",
    "scholarship for students india", "nsp scholarship 2027",
    "up scholarship 2027", "minority scholarship 2027",
    "merit scholarship india 2027", "free scholarship for poor students",
    "scholarship last date 2027",
  ],
  "study-abroad": [
    "study abroad 2027 india", "abroad scholarship for indian students",
    "study in usa canada uk 2027", "student visa 2027 process",
    "ielts toefl 2027", "foreign university admission 2027",
    "education loan abroad 2027", "free study abroad countries 2027",
  ],
  edtech: [
    "best app for exam preparation 2027",
    "online coaching vs offline coaching",
    "free online study material 2027",
    "best youtube channel upsc ssc 2027",
    "swayam nptel free course 2027",
    "edtech india 2027", "ai tools for students 2027",
    "online mock test free 2027",
  ],
  "student-life": [
    "student life india tips", "exam stress management tips",
    "hostel life tips india", "budget living student india",
    "study life balance tips", "coaching city guide india",
    "mukherjee nagar kota coaching guide",
    "student mental health india",
  ],
  opinion: [
    "education system india analysis",
    "neet controversy analysis 2027",
    "exam reform india opinion",
    "coaching culture india",
    "education policy opinion india",
    "upsc reform needed india",
    "education news opinion editorial",
  ],
};

// ─────────────────────────────────────────────────
// 2A. KEYWORD BUILDER FUNCTIONS
// ─────────────────────────────────────────────────

/** Current year — keeps titles/descriptions fresh automatically */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/** Academic year range e.g. "2027-28" */
export function getCurrentYearRange(): string {
  const y = getCurrentYear();
  return `${y}-${String(y + 1).slice(2)}`;
}

/** Format last-modified date for on-page freshness signal */
export function buildLastModifiedSignal(updatedAt: string): string {
  return new Date(updatedAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

/** Expand {exam} template tokens */
function injectExamName(template: string, examName: string, year: number): string {
  return template
    .replace(/\{exam\}/g, examName)
    .replace(/\{year\}/g, String(year));
}

/** Build keyword list for a content-type page */
export function buildContentTypeKeywords(
  examName: string,
  examSlug: string,
  contentType: ContentType,
  year = getCurrentYear(),
): string[] {
  const template = CONTENT_TYPE_KEYWORDS[contentType];
  const examKw   = EXAM_KEYWORDS[examSlug];

  const suffixKws   = template.suffixes.map((s) => `${examName} ${s}`);
  const injectedKws = template.longTailTemplates.map((t) =>
    injectExamName(t, examName, year),
  );

  return [
    ...suffixKws,
    ...injectedKws,
    ...(examKw?.shortTail.slice(0, 5) ?? []),
    ...(examKw?.longTail.slice(0, 5) ?? []),
  ];
}

export type BuildKeywordsInput = {
  pageType: string;
  pillar?: Pillar;
  examSlug?: string;
  contentType?: ContentType;
  blogSection?: BlogSection;
  extraKeywords?: string[];
};

/** Master keyword builder — call from every generateMetadata() */
export function buildPageKeywords(input: BuildKeywordsInput): string[] {
  const { pillar, examSlug, contentType, blogSection, extraKeywords = [] } = input;
  const keywords: string[] = [];

  keywords.push(...GLOBAL_SHORT_TAIL);

  if (pillar) keywords.push(...PILLAR_KEYWORDS[pillar]);

  if (examSlug && EXAM_KEYWORDS[examSlug]) {
    const ek = EXAM_KEYWORDS[examSlug];
    keywords.push(...ek.shortTail, ...ek.longTail, ...ek.lsi, ...ek.local);
  }

  if (examSlug && contentType) {
    keywords.push(
      ...buildContentTypeKeywords(examSlug.replace(/-/g, " ").toUpperCase(), examSlug, contentType),
    );
  }

  if (blogSection) keywords.push(...BLOG_SECTION_KEYWORDS[blogSection]);

  keywords.push(...extraKeywords);

  // Deduplicate, normalise, limit to 20
  return [...new Set(keywords.map((k) => k.toLowerCase().trim()))].slice(0, 20);
}

// ─────────────────────────────────────────────────
// 2B. SEO TITLE BUILDER (keyword-first, ≤60 chars)
// ─────────────────────────────────────────────────
const TITLE_PATTERNS: Record<string, (name: string, y: number) => string> = {
  "admit-card":      (n, y) => `${n} Admit Card ${y} — Download Hall Ticket`,
  result:            (n, y) => `${n} Result ${y} — Check Marksheet`,
  "answer-key":      (n, y) => `${n} Answer Key ${y} — Set Wise PDF`,
  syllabus:          (n, y) => `${n} Syllabus ${y} — PDF & Exam Pattern`,
  "date-sheet":      (n, y) => `${n} Date Sheet ${y} — PDF Download`,
  cutoff:            (n, y) => `${n} Cut Off ${y} — Category Wise`,
  "previous-papers": (n, _) => `${n} Previous Year Papers — PDF Download`,
  "mock-test":       (n, y) => `${n} Mock Test ${y} — Free Online`,
  notification:      (n, y) => `${n} ${y} — Notification, Apply Online`,
  application:       (n, y) => `${n} Apply Online ${y} — Last Date`,
  books:             (n, y) => `Best Books for ${n} ${y}`,
};

export function buildSEOTitle(
  examShortName: string,
  contentType: string,
  year = getCurrentYear(),
): string {
  const fn = TITLE_PATTERNS[contentType];
  if (!fn) return `${examShortName} ${year} — Latest Updates`;
  return fn(examShortName, year);
}

// ─────────────────────────────────────────────────
// 2C. META DESCRIPTION BUILDER (150-160 chars)
// ─────────────────────────────────────────────────
export function buildMetaDescription(
  examName: string,
  contentType: ContentType,
  keyDateInfo = "",
  year = getCurrentYear(),
): string {
  const y = year;
  const templates: Partial<Record<ContentType, string>> = {
    "admit-card":
      `Download ${examName} Admit Card ${y}. Get direct link to hall ticket, check release date, steps to download. ${keyDateInfo}. Official link available here.`,
    result:
      `Check ${examName} Result ${y} online. Download marksheet, check cut off marks, merit list & score card. ${keyDateInfo}. Direct link to result page.`,
    "answer-key":
      `Download ${examName} Answer Key ${y}. Get Set A B C D answer key PDF, raise objections, check provisional & final key. ${keyDateInfo}.`,
    syllabus:
      `${examName} Syllabus ${y} PDF download. Complete topic-wise syllabus, exam pattern, marking scheme & important chapters. ${keyDateInfo}.`,
    "date-sheet":
      `${examName} Date Sheet ${y} PDF released. Check subject-wise exam schedule, practical exam dates & time table. Download official PDF here.`,
    cutoff:
      `${examName} Cut Off ${y} — Category-wise (General/OBC/SC/ST/EWS) cut off marks. Previous year cut off & expected cut off analysis. ${keyDateInfo}.`,
    "previous-papers":
      `Download ${examName} Previous Year Papers PDF. Year-wise & shift-wise solved papers 2024, 2023, 2022. Free download with answer key. Practice now.`,
    "mock-test":
      `${examName} Free Mock Test ${y} online. Attempt full-length practice test series, topic-wise tests & get instant results. Start practice now.`,
    "study-material":
      `${examName} Study Material ${y} free PDF. Chapter-wise notes, short notes, formula sheets & important topics. Download free study material PDF here.`,
    notification:
      `${examName} ${y} Notification released. Check eligibility, vacancy, application dates, exam pattern & how to apply online. ${keyDateInfo}.`,
    application:
      `Apply online for ${examName} ${y}. Step-by-step application guide, direct link, fee details & last date. ${keyDateInfo}. Apply before deadline.`,
    books:
      `Best books for ${examName} ${y} preparation. Subject-wise recommended books, free PDF resources & study material list by toppers.`,
  };

  const desc = templates[contentType] ??
    `${examName} ${y} latest updates. Check notification, admit card, result, syllabus, answer key and previous year papers. ${keyDateInfo}.`;

  return desc.substring(0, 160);
}

// ─────────────────────────────────────────────────
// 2D. IMAGE ALT TEXT
// ─────────────────────────────────────────────────
export function buildImageAlt(
  examName: string,
  contentType: ContentType,
  year = getCurrentYear(),
): string {
  const altMap: Partial<Record<ContentType, string>> = {
    "admit-card":      `${examName} Admit Card ${year} — Hall Ticket Download`,
    result:            `${examName} Result ${year} — Check Marksheet`,
    "answer-key":      `${examName} Answer Key ${year} — Set Wise PDF`,
    syllabus:          `${examName} Syllabus ${year} — Topic Wise PDF`,
    "date-sheet":      `${examName} Date Sheet ${year} — Time Table`,
    cutoff:            `${examName} Cut Off ${year} — Category Wise`,
    "previous-papers": `${examName} Previous Year Papers PDF`,
    "mock-test":       `${examName} Mock Test ${year} — Practice Online`,
    "study-material":  `${examName} Study Material ${year} — Free PDF`,
    notification:      `${examName} ${year} Notification PDF`,
    application:       `${examName} Apply Online ${year} — Form`,
    books:             `Best Books for ${examName} ${year}`,
  };
  return altMap[contentType] ?? `${examName} ${year}`;
}

// ─────────────────────────────────────────────────
// 2E. ANCHOR TEXT BUILDER
// ─────────────────────────────────────────────────
export function buildAnchorText(
  examName: string,
  contentType: ContentType,
  year = getCurrentYear(),
): string {
  const anchors: Partial<Record<ContentType, string>> = {
    "admit-card":      `${examName} Admit Card ${year}`,
    result:            `${examName} Result ${year}`,
    "answer-key":      `${examName} Answer Key ${year}`,
    syllabus:          `${examName} Syllabus ${year}`,
    "date-sheet":      `${examName} Date Sheet ${year}`,
    cutoff:            `${examName} Cut Off ${year}`,
    "previous-papers": `${examName} Previous Year Papers`,
    "mock-test":       `${examName} Mock Test ${year}`,
    "study-material":  `${examName} Study Material ${year}`,
    notification:      `${examName} ${year} Notification`,
    application:       `Apply for ${examName} ${year}`,
    books:             `Best Books for ${examName}`,
  };
  return anchors[contentType] ?? `${examName} ${year}`;
}

// ─────────────────────────────────────────────────
// HIGH-PRIORITY SLUGS for sitemap priority boost
// ─────────────────────────────────────────────────
export const HIGH_PRIORITY_SLUGS = new Set([
  "neet-ug", "jee-main", "civil-services", "ssc-cgl",
  "ibps-po", "sbi-po", "rrb-ntpc",
  "high-school", "intermediate", "class-10", "class-12",
  "ignou", "ctet", "uppsc-pcs", "up-police-constable",
  "gate", "clat-ug", "cat", "mjpru",
]);
