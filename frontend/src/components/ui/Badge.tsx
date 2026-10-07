import type { ReactNode } from "react";

export type Tone = "neutral" | "risk" | "warning" | "success" | "info";

const LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  INTERESTED: "Interested",
  APPOINTMENT_BOOKED: "Appt Booked",
  APPOINTMENT_COMPLETED: "Appt Done",
  NEGOTIATION: "Negotiation",
  CONVERTED: "Won",
  LOST: "Lost",
  RECOVERY: "Recovery",
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  SKIPPED: "Skipped",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
  SCHEDULED: "Scheduled",
  CONFIRMED: "Confirmed",
  MISSED: "Missed",
  OPEN: "Open",
  RESOLVED: "Resolved",
  EXPIRED: "Expired",
  DRAFT: "Draft",
  APPROVED: "Approved",
  SENT: "Sent",
  REJECTED: "Rejected",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
  HIGH_PRIORITY: "High Priority",
  FOLLOWUP_OVERDUE: "Follow-up Overdue",
  SILENT_CUSTOMER: "Silent Customer",
  MISSED_APPOINTMENT: "Missed Appt",
  HIGH_VALUE_CUSTOMER: "High Value",
  LOST_CUSTOMER: "Lost Customer",
  RECOVERY_OPPORTUNITY: "Recovery Opportunity",
};

export function labelFor(value: string): string {
  return LABELS[value] ?? value.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export function toneFor(value: string): Tone {
  if (["LOST", "OVERDUE", "MISSED", "URGENT", "HIGH_PRIORITY", "FOLLOWUP_OVERDUE", "SILENT_CUSTOMER"].includes(value)) return "risk";
  if (["PENDING", "IN_PROGRESS", "INTERESTED", "NEGOTIATION", "RECOVERY", "RECOVERY_OPPORTUNITY", "HIGH", "APPOINTMENT_BOOKED"].includes(value)) return "warning";
  if (["CONVERTED", "COMPLETED", "RESOLVED", "APPROVED", "SENT", "CONFIRMED"].includes(value)) return "success";
  if (["NEW", "QUALIFIED", "CONTACTED", "APPOINTMENT_COMPLETED", "HIGH_VALUE_CUSTOMER"].includes(value)) return "info";
  return "neutral";
}

interface Props {
  value: string;
  tone?: Tone;
  children?: ReactNode;
}

export function Badge({ value, tone, children }: Props) {
  const t = tone ?? toneFor(value);
  return <span className={`badge badge-${t}`}>{children ?? labelFor(value)}</span>;
}
