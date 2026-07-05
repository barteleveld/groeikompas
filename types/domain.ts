export const assignmentStatuses = [
  "not_started",
  "in_progress",
  "submitted",
  "feedback_received",
  "feedback_processed",
  "completed",
] as const;

export type AssignmentStatus = (typeof assignmentStatuses)[number];

export const learningGoalLevels = [
  "not_visible",
  "developing",
  "demonstrated",
  "strongly_demonstrated",
] as const;

export type LearningGoalLevel = (typeof learningGoalLevels)[number];
export type UserRole = "student" | "teacher" | "admin";

export const assignmentStatusLabels: Record<AssignmentStatus, string> = {
  not_started: "Niet gestart",
  in_progress: "Bezig",
  submitted: "Ingeleverd",
  feedback_received: "Feedback ontvangen",
  feedback_processed: "Feedback verwerkt",
  completed: "Afgerond",
};

export const learningGoalLevelLabels: Record<LearningGoalLevel, string> = {
  not_visible: "Nog niet zichtbaar",
  developing: "In ontwikkeling",
  demonstrated: "Voldoende aangetoond",
  strongly_demonstrated: "Sterk aangetoond",
};

export interface AssignmentProgress {
  id: string;
  assignmentId: string;
  title: string;
  description: string;
  deadline: string | null;
  status: AssignmentStatus;
}

export interface GoalProgress {
  id: string;
  learningGoalId: string;
  title: string;
  description: string;
  level: LearningGoalLevel;
}

export interface FeedbackItem {
  id: string;
  assignmentId: string | null;
  learningGoalId: string | null;
  subject: string;
  teacherName: string;
  feedbackText: string;
  feedforwardText: string;
  createdAt: string;
  processedByStudent: boolean;
}

export interface NextAction {
  id: string;
  label: string;
  detail: string;
  href: string;
  kind: "start" | "wait" | "feedback" | "evidence";
  priority: number;
}
