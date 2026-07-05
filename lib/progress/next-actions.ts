import { differenceInCalendarDays, parseISO } from "date-fns";
import type {
  AssignmentProgress,
  FeedbackItem,
  GoalProgress,
  NextAction,
} from "@/types/domain";

type Input = {
  assignments: AssignmentProgress[];
  goals: GoalProgress[];
  feedback: FeedbackItem[];
  now?: Date;
};

/**
 * Leidt concrete acties af zonder een kunstmatige totaalscore te berekenen.
 * Een actie met een lagere priority komt eerder in beeld.
 */
export function deriveNextActions({ assignments, goals, feedback, now = new Date() }: Input) {
  const actions: NextAction[] = [];

  for (const item of assignments) {
    const days = item.deadline
      ? differenceInCalendarDays(parseISO(item.deadline), now)
      : Number.POSITIVE_INFINITY;

    if (item.status === "feedback_received") {
      actions.push({
        id: `feedback-${item.id}`,
        label: `Verwerk de feedback op ${item.title}`,
        detail: "Bekijk de aanwijzingen, verbeter je werk en leg kort uit wat je hebt aangepast.",
        href: `/student/opdrachten/${item.assignmentId}`,
        kind: "feedback",
        priority: 1,
      });
    } else if (item.status === "not_started" && days <= 7) {
      actions.push({
        id: `start-${item.id}`,
        label: `Start met ${item.title}`,
        detail: days < 0 ? "De deadline is verstreken. Bespreek je planning met je docent." : `De deadline is over ${days} ${days === 1 ? "dag" : "dagen"}.`,
        href: `/student/opdrachten/${item.assignmentId}`,
        kind: "start",
        priority: days < 0 ? 0 : 2,
      });
    } else if (item.status === "submitted") {
      actions.push({
        id: `wait-${item.id}`,
        label: `Wacht op feedback over ${item.title}`,
        detail: "Je werk is ingeleverd. Je hoeft nu niets aan te passen.",
        href: `/student/opdrachten/${item.assignmentId}`,
        kind: "wait",
        priority: 5,
      });
    }
  }

  for (const item of feedback.filter((entry) => !entry.processedByStudent)) {
    if (item.assignmentId && actions.some((action) => action.kind === "feedback" && action.href === `/student/opdrachten/${item.assignmentId}`)) continue;
    actions.push({
      id: `feedback-item-${item.id}`,
      label: `Geef aan wat je met de feedback op ${item.subject} hebt gedaan`,
      detail: item.feedforwardText,
      href: item.assignmentId
        ? `/student/opdrachten/${item.assignmentId}`
        : `/student/leerdoelen/${item.learningGoalId}`,
      kind: "feedback",
      priority: 1,
    });
  }

  for (const goal of goals.filter((item) => item.level === "not_visible")) {
    actions.push({
      id: `goal-${goal.id}`,
      label: `Toon “${goal.title}” aan`,
      detail: "Koppel een opdracht of voeg een passend bewijsstuk toe.",
      href: `/student/leerdoelen/${goal.learningGoalId}`,
      kind: "evidence",
      priority: 4,
    });
  }

  return actions.sort((a, b) => a.priority - b.priority || a.label.localeCompare(b.label, "nl"));
}
