/** Realistic mock corporate dataset — no network calls. */

export const departments = [
  { id: "dept-rd", name: "Research & Development" },
  { id: "dept-ops", name: "Operations & Supply Chain" },
  { id: "dept-hr", name: "People & Culture" },
  { id: "dept-fin", name: "Finance & Strategy" },
  { id: "dept-mkt", name: "Marketing & Brand" },
];

export const categories = [
  { id: "cat-sustainability", label: "Sustainability" },
  { id: "cat-efficiency", label: "Operational efficiency" },
  { id: "cat-customer", label: "Customer experience" },
  { id: "cat-product", label: "Product innovation" },
  { id: "cat-culture", label: "Culture & engagement" },
  { id: "cat-risk", label: "Risk & compliance" },
];

export const users = [
  {
    id: "u-amelia",
    name: "Amelia Chen",
    title: "Principal Engineer",
    departmentId: "dept-rd",
    avatarInitials: "AC",
  },
  {
    id: "u-jordan",
    name: "Jordan Okonkwo",
    title: "Director, Supply Planning",
    departmentId: "dept-ops",
    avatarInitials: "JO",
  },
  {
    id: "u-samira",
    name: "Samira Patel",
    title: "VP, People Experience",
    departmentId: "dept-hr",
    avatarInitials: "SP",
  },
  {
    id: "u-marcus",
    name: "Marcus Lindqvist",
    title: "Head of FP&A",
    departmentId: "dept-fin",
    avatarInitials: "ML",
  },
  {
    id: "u-elena",
    name: "Elena Rossi",
    title: "Senior Product Marketing Manager",
    departmentId: "dept-mkt",
    avatarInitials: "ER",
  },
];

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const initialIdeas = [
  {
    id: "idea-001",
    title: "Closed-loop packaging take-back for enterprise clients",
    description:
      "Pilot a regional take-back program where field teams collect empty consumable packaging during scheduled visits. Materials are sorted locally and routed to certified recyclers, with a quarterly impact dashboard shared with procurement leads.",
    categoryId: "cat-sustainability",
    departmentId: "dept-ops",
    authorId: "u-jordan",
    votes: 47,
    progressStatus: "published",
    createdAt: daysAgo(2),
    comments: [
      {
        id: "c-1",
        authorId: "u-amelia",
        body: "We should align with the existing asset tracking app so crews do not carry a second device.",
        createdAt: daysAgo(1),
      },
      {
        id: "c-2",
        authorId: "u-samira",
        body: "Great story for our employer brand. Happy to help draft the internal announcement tone.",
        createdAt: daysAgo(1),
      },
    ],
    devilQuestions: null,
    devilAnswers: [],
    aiPackageId: "pkg-sustainability",
  },
  {
    id: "idea-002",
    title: "Cross-functional “decision memo” template in the intranet",
    description:
      "Standardize a one-page memo format that captures problem, options, trade-offs, and owner. Attachments stay optional so leadership reviews stay fast and consistent across regions.",
    categoryId: "cat-efficiency",
    departmentId: "dept-fin",
    authorId: "u-marcus",
    votes: 31,
    progressStatus: "published",
    createdAt: daysAgo(5),
    comments: [
      {
        id: "c-3",
        authorId: "u-elena",
        body: "If we ship this, marketing can mirror the structure for campaign approvals too.",
        createdAt: daysAgo(4),
      },
    ],
    devilQuestions: null,
    devilAnswers: [],
    aiPackageId: "pkg-efficiency",
  },
  {
    id: "idea-003",
    title: "Customer health score visible to account teams",
    description:
      "Aggregate product usage, support tickets, and NPS into a simple green-amber-red signal inside the CRM sidebar. Account managers get proactive playbooks when the signal drops for two consecutive weeks.",
    categoryId: "cat-customer",
    departmentId: "dept-mkt",
    authorId: "u-elena",
    votes: 62,
    progressStatus: "published",
    createdAt: daysAgo(9),
    comments: [
      {
        id: "c-4",
        authorId: "u-jordan",
        body: "Ops can feed shipment delay data into the same model once APIs are stable.",
        createdAt: daysAgo(8),
      },
    ],
    devilQuestions: null,
    devilAnswers: [],
    aiPackageId: "pkg-customer",
  },
  {
    id: "idea-004",
    title: "Mentor-matching based on skills graph, not job title",
    description:
      "Use the internal skills inventory to suggest mentors for stretch assignments. Emphasize short six-week commitments so participation stays realistic for senior contributors.",
    categoryId: "cat-culture",
    departmentId: "dept-hr",
    authorId: "u-samira",
    votes: 28,
    progressStatus: "published",
    createdAt: daysAgo(12),
    comments: [],
    devilQuestions: null,
    devilAnswers: [],
    aiPackageId: "pkg-culture",
  },
  {
    id: "idea-005",
    title: "Lightweight vendor security questionnaire automation",
    description:
      "Pre-fill answers from last year’s assessment when vendors reuse the same subprocessors. Flag deltas only, so procurement and infosec review the exceptions instead of the full packet every cycle.",
    categoryId: "cat-risk",
    departmentId: "dept-rd",
    authorId: "u-amelia",
    votes: 19,
    progressStatus: "published",
    createdAt: daysAgo(18),
    comments: [
      {
        id: "c-5",
        authorId: "u-marcus",
        body: "Finance will want a single export for audit season — worth scoping early.",
        createdAt: daysAgo(17),
      },
    ],
    devilQuestions: null,
    devilAnswers: [],
    aiPackageId: "pkg-risk",
  },
];

/** AI suggestion templates by logical package id */
export const aiPackages = {
  "pkg-sustainability": {
    improvements: [
      {
        id: "imp-s1",
        text: "Add a measurable baseline (tonnes diverted per quarter) and name the accountable regional sponsor.",
      },
      {
        id: "imp-s2",
        text: "Clarify how you will verify recycler certificates and handle mixed-material edge cases.",
      },
      {
        id: "imp-s3",
        text: "Include a lightweight change-management plan for frontline teams who already run tight visit windows.",
      },
    ],
    similarWarnings: [
      {
        id: "sim-s1",
        title: "Similar active idea",
        detail:
          "“Reverse logistics hub for consumables” is in discovery with Operations and already has executive sponsorship in EMEA.",
      },
    ],
    devilQuestions: [
      "What happens to collection quality if visit schedules slip during peak season?",
      "Which customer contracts would need amended language for packaging return liability?",
      "How will you prove environmental impact without overburdening local teams with data entry?",
    ],
  },
  "pkg-efficiency": {
    improvements: [
      {
        id: "imp-e1",
        text: "Specify where the memo lives (intranet page vs. shared drive) and the expected review SLA.",
      },
      {
        id: "imp-e2",
        text: "Add a short example memo for a common decision type (budget shift, vendor change).",
      },
    ],
    similarWarnings: [
      {
        id: "sim-e1",
        title: "Overlapping initiative",
        detail:
          "Corporate Communications is piloting a shorter briefing format for town halls — align naming to avoid two competing templates.",
      },
    ],
    devilQuestions: [
      "How do you prevent the memo from becoming another mandatory form that teams ignore?",
      "What is the escalation path when two VPs disagree on the recommendation section?",
      "Which systems will store the canonical decision record for audits?",
    ],
  },
  "pkg-customer": {
    improvements: [
      {
        id: "imp-c1",
        text: "Define the minimum data freshness (daily vs. hourly) and the fallback when a data source is delayed.",
      },
      {
        id: "imp-c2",
        text: "Address privacy: which signals are safe to show to all account roles vs. managers only.",
      },
    ],
    similarWarnings: [
      {
        id: "sim-c1",
        title: "Related roadmap item",
        detail:
          "Product Analytics is shipping a usage digest widget next quarter — coordinate to avoid duplicate metrics.",
      },
    ],
    devilQuestions: [
      "Could a simplified score hide important nuance and cause false confidence?",
      "What is the playbook when the score is red but the customer refuses an intervention call?",
      "How will you measure whether the signal actually reduces churn within six months?",
    ],
  },
  "pkg-culture": {
    improvements: [
      {
        id: "imp-cu1",
        text: "Spell out mentor time commitment and how workload relief is negotiated with managers.",
      },
      {
        id: "imp-cu2",
        text: "Include safeguards so underrepresented groups are not over-tapped as mentors disproportionately.",
      },
    ],
    similarWarnings: [],
    devilQuestions: [
      "What if the skills graph is incomplete for newer hires — how do you avoid biased matching?",
      "How will you measure mentorship quality beyond participation counts?",
      "What incentives exist for senior experts who are already at capacity?",
    ],
  },
  "pkg-risk": {
    improvements: [
      {
        id: "imp-r1",
        text: "Clarify retention rules for prior-year answers and how vendors consent to reuse.",
      },
      {
        id: "imp-r2",
        text: "Add a security review step when deltas touch data residency or subprocessors in new regions.",
      },
    ],
    similarWarnings: [
      {
        id: "sim-r1",
        title: "Compliance overlap",
        detail:
          "Legal is consolidating vendor questionnaires globally — confirm your workflow fits the 2026 policy refresh.",
      },
    ],
    devilQuestions: [
      "What is the remediation path if a vendor refuses to accept automated deltas?",
      "How do you prevent teams from skipping human review on high-risk vendors?",
      "Which KPI will prove time saved without increasing incident rate?",
    ],
  },
  "pkg-product": {
    improvements: [
      {
        id: "imp-p1",
        text: "Tighten the customer problem statement with a specific persona and measurable pain.",
      },
      {
        id: "imp-p2",
        text: "List assumptions to validate in the first four weeks and how you will test them.",
      },
    ],
    similarWarnings: [
      {
        id: "sim-p1",
        title: "Similar idea",
        detail:
          "“Guided onboarding checklist for complex SKUs” is in review with the product council.",
      },
    ],
    devilQuestions: [
      "What is the smallest slice you can ship that still delivers standalone value?",
      "Which teams must commit capacity before you ask for funding?",
      "How will you decide to stop if early signals are weak?",
    ],
  },
};

export function resolveAiPackageId(categoryId) {
  const map = {
    "cat-sustainability": "pkg-sustainability",
    "cat-efficiency": "pkg-efficiency",
    "cat-customer": "pkg-customer",
    "cat-product": "pkg-product",
    "cat-culture": "pkg-culture",
    "cat-risk": "pkg-risk",
  };
  return map[categoryId] || "pkg-product";
}

export function getDepartmentName(id) {
  return departments.find((d) => d.id === id)?.name ?? "Unknown";
}

export function getCategoryLabel(id) {
  return categories.find((c) => c.id === id)?.label ?? "General";
}

export function getUserById(id) {
  return users.find((u) => u.id === id);
}
