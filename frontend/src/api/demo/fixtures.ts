import type {
  ActionPlanItem,
  Appointment,
  Customer,
  DashboardPulse,
  FollowUp,
  Lead,
  LeadReportRow,
  RadarCategory,
  RadarSummary,
  RecoveryAction,
  RecoveryScore,
  RevenueSummary,
  TeamMember,
} from "../types";

const now = new Date();
const iso = (daysAgo: number, hour = 10) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 30, 0, 0);
  return d.toISOString();
};
const future = (days: number, hour = 11) => {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const NAMES = [
  "Rahul Sharma", "Priya Reddy", "Anil Kumar", "Sneha Gupta", "Vikram Rao",
  "Lakshmi Devi", "Suresh Babu", "Kavya Nair", "Ravi Teja", "Ananya Iyer",
  "Mohammed Irfan", "Divya Priya", "Harsha Vardhan", "Meena Kumari", "Arjun Patel",
  "Swathi Krishnan", "Naveen Chandra", "Pooja Hegde", "Sandeep Singh", "Rithika Jain",
  "Ganesh Murthy", "Shruti Desai", "Karthik Subramani", "Bhavana Reddy", "Arun Prakash",
  "Nisha Verma", "Sathish Kumar", "Ramya Sri", "Deepak Joshi", "Tanvi Shah",
];

const SERVICES = [
  "Dental Implant", "Root Canal", "Teeth Cleaning", "Braces Consultation",
  "Whitening", "Crown Fitting", "Consultation", "Full Mouth Rehab",
];
const SOURCES = ["WhatsApp", "Google", "Instagram", "Walk-in", "Referral", "Website", "JustDial"];
const OWNERS = ["Rahul", "Priya", "Anil"];

const score = (total: number): RecoveryScore => {
  const intent = Math.round(total * 0.25);
  const engagement = Math.round(total * 0.2);
  const value = Math.round(total * 0.15);
  const recency = Math.round(total * 0.15);
  const followupRisk = Math.round(total * 0.15);
  const appointment = total - intent - engagement - value - recency - followupRisk;
  return {
    score: total,
    intentScore: intent,
    engagementScore: engagement,
    valueScore: value,
    recencyScore: recency,
    followupRiskScore: followupRisk,
    appointmentSignalScore: appointment,
    factors: [
      "Asked for pricing on " + SERVICES[total % SERVICES.length],
      followupRisk > 10 ? "No follow-up in the last 72 hours" : "Follow-up completed recently",
      appointment > 6 ? "Appointment booked but not confirmed" : "No appointment signal",
      value > 10 ? "High estimated customer value" : "Average estimated value",
    ],
    computedAt: iso(0, 8),
  };
};

export const demoCustomers: Customer[] = NAMES.map((name, i) => ({
  id: `cust-${i + 1}`,
  organizationId: "org-demo",
  name,
  phone: `+91 98${String(48000000 + i * 137).slice(0, 8)}`,
  email: `${name.split(" ")[0].toLowerCase()}${i}@example.in`,
  location: i % 3 === 0 ? "Hyderabad" : i % 3 === 1 ? "Secunderabad" : "Gachibowli",
  source: SOURCES[i % SOURCES.length],
  tags: i % 4 === 0 ? ["high-value"] : i % 5 === 0 ? ["at-risk"] : [],
  totalRevenue: (i % 7) * 4500,
  lastInteractionAt: iso((i * 3) % 40),
  aiSummary:
    i % 4 === 0
      ? "Enquired about treatment cost twice. Price-sensitive but clearly interested."
      : undefined,
  createdAt: iso(60 - (i % 50)),
}));

const STATUSES: Lead["status"][] = [
  "NEW", "CONTACTED", "QUALIFIED", "INTERESTED", "APPOINTMENT_BOOKED",
  "APPOINTMENT_COMPLETED", "NEGOTIATION", "CONVERTED", "LOST", "RECOVERY",
];

export const demoLeads: Lead[] = demoCustomers.map((c, i) => {
  const s = score(58 + ((i * 7) % 42));
  const status = STATUSES[i % STATUSES.length];
  const estimated = 4000 + ((i * 1750) % 46000);
  return {
    id: `lead-${i + 1}`,
    organizationId: "org-demo",
    customerId: c.id,
    customerName: c.name,
    source: c.source,
    service: SERVICES[i % SERVICES.length],
    status,
    priority: s.score >= 88 ? "URGENT" : s.score >= 78 ? "HIGH" : s.score >= 65 ? "MEDIUM" : "LOW",
    estimatedValue: estimated,
    assignedUserId: `u-${(i % 3) + 1}`,
    assignedUserName: OWNERS[i % OWNERS.length],
    lastContactAt: i % 4 === 0 ? undefined : iso((i * 2) % 25),
    nextFollowUpAt: i % 5 === 0 ? future(-2) : i % 3 === 0 ? future(1) : undefined,
    lostReasonCode: status === "LOST" ? ["PRICE", "NO_FOLLOW_UP", "COMPETITOR", "NO_RESPONSE"][i % 4] : undefined,
    recoveryScore: s,
    createdAt: iso(45 - (i % 40)),
    updatedAt: iso((i * 5) % 15),
  };
});

const REASONS: Record<RadarCategory, string> = {
  HIGH_PRIORITY: "Strong purchase intent, not contacted yet",
  FOLLOWUP_OVERDUE: "Follow-up deadline passed",
  SILENT_CUSTOMER: "Was active, stopped responding",
  MISSED_APPOINTMENT: "Appointment scheduled but not attended",
  HIGH_VALUE_CUSTOMER: "High potential revenue customer",
  LOST_CUSTOMER: "Marked as lost",
  RECOVERY_OPPORTUNITY: "AI believes this customer can still be recovered",
};

const REC_ACTIONS: Record<RadarCategory, string> = {
  HIGH_PRIORITY: "Contact now with pricing details",
  FOLLOWUP_OVERDUE: "Send follow-up message today",
  SILENT_CUSTOMER: "Send re-engagement offer",
  MISSED_APPOINTMENT: "Reschedule the missed appointment",
  HIGH_VALUE_CUSTOMER: "Assign senior staff for personal outreach",
  LOST_CUSTOMER: "Send win-back message",
  RECOVERY_OPPORTUNITY: "Send AI-drafted follow-up",
};

export const demoRecoveryActions: RecoveryAction[] = demoLeads
  .filter((l) => l.status !== "CONVERTED")
  .map((l, i) => {
    const categories: RadarCategory[] = [
      "HIGH_PRIORITY", "FOLLOWUP_OVERDUE", "SILENT_CUSTOMER",
      "MISSED_APPOINTMENT", "RECOVERY_OPPORTUNITY", "HIGH_VALUE_CUSTOMER",
    ];
    const category = l.recoveryScore!.score >= 90 ? "RECOVERY_OPPORTUNITY" : categories[i % categories.length];
    return {
      id: `ra-${i + 1}`,
      leadId: l.id,
      customerId: l.customerId,
      customerName: l.customerName,
      category,
      status: i % 6 === 0 ? "IN_PROGRESS" : "OPEN",
      potentialValue: l.estimatedValue ?? 10000,
      recoveryScore: l.recoveryScore!.score,
      reason: REASONS[category],
      recommendedAction: REC_ACTIONS[category],
      openedAt: iso(i % 12),
    };
  });

export const demoFollowUps: FollowUp[] = demoLeads.slice(0, 29).map((l, i) => ({
  id: `fu-${i + 1}`,
  leadId: l.id,
  customerId: l.customerId,
  customerName: l.customerName,
  assignedUserId: l.assignedUserId,
  assignedUserName: l.assignedUserName,
  dueAt: i < 11 ? future(-1 - (i % 4)) : i < 20 ? future(0, 9 + (i % 8)) : future(1 + (i % 5)),
  priority: l.priority,
  status: i < 11 ? "OVERDUE" : i < 20 ? "PENDING" : "PENDING",
  reason: i % 3 === 0 ? "PRICE_FOLLOWUP" : i % 3 === 1 ? "REACTIVATION" : "APPOINTMENT_MISSED",
  completedAt: i % 7 === 0 ? iso(1) : undefined,
}));

export const demoAppointments: Appointment[] = demoLeads.slice(0, 18).map((l, i) => ({
  id: `ap-${i + 1}`,
  customerId: l.customerId,
  customerName: l.customerName,
  leadId: l.id,
  service: l.service,
  scheduledAt: i < 8 ? iso(i + 1, 11) : future(i % 6, 10 + (i % 7)),
  status: i < 4 ? "MISSED" : i < 8 ? "COMPLETED" : i % 4 === 0 ? "CONFIRMED" : "SCHEDULED",
}));

export const demoRevenue: RevenueSummary = {
  atRisk: 482000,
  potential: 127000,
  recovered: 48000,
  roiMultiple: 12.5,
  currency: "INR",
  recoveredVerified: true,
};

export const demoPulse: DashboardPulse = {
  highPriority: 17,
  dueToday: 29,
  overdue: 11,
  silentCustomers: 41,
  missedAppointments: 8,
};

export const demoRadar: RadarSummary = {
  categories: [
    { category: "RECOVERY_OPPORTUNITY", count: 7, potentialValue: 84000 },
    { category: "HIGH_PRIORITY", count: 17, potentialValue: 156000 },
    { category: "FOLLOWUP_OVERDUE", count: 11, potentialValue: 72000 },
    { category: "SILENT_CUSTOMER", count: 41, potentialValue: 98000 },
    { category: "MISSED_APPOINTMENT", count: 8, potentialValue: 46000 },
    { category: "HIGH_VALUE_CUSTOMER", count: 12, potentialValue: 214000 },
    { category: "LOST_CUSTOMER", count: 15, potentialValue: 63000 },
  ],
};

export const demoActionPlan: ActionPlanItem[] = demoRecoveryActions
  .slice()
  .sort((a, b) => b.recoveryScore - a.recoveryScore)
  .slice(0, 7)
  .map((a) => ({
    id: a.id,
    leadId: a.leadId,
    customerName: a.customerName,
    type: a.category,
    recoveryScore: a.recoveryScore,
    potentialValue: a.potentialValue,
    reason: a.reason,
  }));

export const demoLostReport: LeadReportRow[] = [
  { label: "No Follow-up", value: 31, amount: 96000 },
  { label: "Price", value: 22, amount: 68000 },
  { label: "Slow Response", value: 17, amount: 52000 },
  { label: "Competitor", value: 11, amount: 34000 },
  { label: "Appointment Issue", value: 9, amount: 28000 },
  { label: "Other", value: 10, amount: 31000 },
];

export const demoTeam: TeamMember[] = OWNERS.map((name, i) => ({
  userId: `u-${i + 1}`,
  name,
  assignedLeads: [120, 98, 80][i],
  contacted: [82, 75, 41][i],
  followUps: [82, 75, 41][i],
  conversions: [15, 12, 5][i],
  lost: [22, 18, 14][i],
  recoveryActions: [12, 9, 4][i],
  revenue: [240000, 180000, 70000][i],
}));

export const demoMessages: Record<string, string> = {
  EN: "Hi {name}, just following up regarding your {service} enquiry. If you'd like, I can help you schedule a consultation at a convenient time. Would tomorrow work for you?",
  TE: `హాయ్ {name}, మీ {service} గురించి మీకు సమాచారం ఇవ్వాలని అనుకుంటున్నాను. మీకు అనుకూలమైన సమయంలో కన్సల్టేషన్ బుక్ చేసుకోవచ్చు. రేపు మీకు వీలైతే ఎలా ఉంటుంది?`,
};
