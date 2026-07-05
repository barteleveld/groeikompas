import { cn } from "@/lib/utils";
import { assignmentStatusLabels, learningGoalLevelLabels, type AssignmentStatus, type LearningGoalLevel } from "@/types/domain";

const styles: Record<AssignmentStatus | LearningGoalLevel, string> = {
  not_started: "bg-slate-100 text-slate-700 ring-slate-300",
  in_progress: "bg-blue-50 text-blue-800 ring-blue-200",
  submitted: "bg-amber-50 text-amber-900 ring-amber-200",
  feedback_received: "bg-fuchsia-50 text-fuchsia-900 ring-fuchsia-200",
  feedback_processed: "bg-indigo-50 text-indigo-900 ring-indigo-200",
  completed: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  not_visible: "bg-slate-100 text-slate-700 ring-slate-300",
  developing: "bg-blue-50 text-blue-800 ring-blue-200",
  demonstrated: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  strongly_demonstrated: "bg-teal-50 text-teal-900 ring-teal-200",
};

export function StatusBadge({ value }: { value: AssignmentStatus | LearningGoalLevel }) {
  const label = value in assignmentStatusLabels
    ? assignmentStatusLabels[value as AssignmentStatus]
    : learningGoalLevelLabels[value as LearningGoalLevel];
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset", styles[value])}>{label}</span>;
}
