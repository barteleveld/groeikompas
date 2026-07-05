import { describe, expect, it } from "vitest";
import { deriveNextActions } from "./next-actions";

describe("deriveNextActions", () => {
  it("zet onverwerkte feedback vooraan", () => {
    const actions = deriveNextActions({
      assignments: [{ id: "p1", assignmentId: "a1", title: "SWOT-analyse", description: "", deadline: "2026-07-08", status: "feedback_received" }],
      goals: [],
      feedback: [],
      now: new Date("2026-07-03T12:00:00Z"),
    });
    expect(actions[0].label).toContain("Verwerk de feedback");
  });

  it("maakt geen percentages of totaalscore", () => {
    const actions = deriveNextActions({ assignments: [], goals: [], feedback: [] });
    expect(JSON.stringify(actions)).not.toMatch(/%|score/i);
  });

  it("toont feedback op dezelfde opdracht maar één keer", () => {
    const actions = deriveNextActions({
      assignments: [{ id: "p1", assignmentId: "a1", title: "SWOT-analyse", description: "", deadline: null, status: "feedback_received" }],
      goals: [],
      feedback: [{ id: "f1", assignmentId: "a1", learningGoalId: null, subject: "SWOT-analyse", teacherName: "Noor", feedbackText: "Goed", feedforwardText: "Onderbouw beter", createdAt: "2026-07-03", processedByStudent: false }],
    });
    expect(actions.filter((action) => action.href === "/student/opdrachten/a1")).toHaveLength(1);
  });
});
