"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const demoStudents = ["Lina Bakker", "Sem de Jong", "Yara Smit", "Omar Aydin", "Fleur Visser"];
export const demoAssignmentStatuses = ["Nog niet gestart", "Bezig", "Ingeleverd", "Feedback ontvangen", "Afgerond"] as const;
export type DemoAssignmentStatus = (typeof demoAssignmentStatuses)[number];
export type DemoModule = { id: string; title: string; description: string; period: string; assignments: string[] };
export type DemoMoment = { id: string; title: string; date: string; kind: string; cohort: string };
export type DemoAssignmentFeedback = {
  id: string;
  student: string;
  assignment: string;
  status: DemoAssignmentStatus;
  feedback: string;
  nextStep: string;
  createdAt: string;
};

type DemoState = {
  modules: DemoModule[];
  moments: DemoMoment[];
  users: { id: string; name: string; role: string }[];
  studentStatus: Record<string, string>;
  assignmentProgress: Record<string, Record<string, DemoAssignmentStatus>>;
  assignmentFeedback: DemoAssignmentFeedback[];
  feedbackResponse: string;
  submissions: string[];
  notifications: { id: string; title: string; read: boolean }[];
};

const initialModules: DemoModule[] = [
  { id: "m1", title: "Omgevingsonderzoek", description: "Van trends naar een heldere analyse.", period: "Periode 1", assignments: ["DESTEP-analyse", "SWOT-analyse", "Doelgroepanalyse"] },
  { id: "m2", title: "Van analyse naar advies", description: "Onderbouw een advies en maak een passende uiting.", period: "Periode 2", assignments: ["Adviesposter", "Adviespresentatie"] },
];

function defaultProgress(modules: DemoModule[]) {
  const assignments = [...new Set(modules.flatMap((module) => module.assignments))];
  return Object.fromEntries(demoStudents.map((student, studentIndex) => [
    student,
    Object.fromEntries(assignments.map((assignment, assignmentIndex) => [
      assignment,
      (["Nog niet gestart", "Bezig", "Ingeleverd", "Feedback ontvangen", "Afgerond"] as DemoAssignmentStatus[])[(studentIndex + assignmentIndex) % 5],
    ])),
  ]));
}

const initial: DemoState = {
  modules: initialModules,
  moments: [
    { id: "f1", title: "Snelle check DESTEP-bronnen", date: "8 juli, 10:00", kind: "Snelle check", cohort: "Marketing 4A" },
    { id: "f2", title: "Peerfeedback adviesposter", date: "15 juli, 13:30", kind: "Feedback van medestudent", cohort: "Marketing 4A" },
  ],
  users: [...demoStudents.map((name, index) => ({ id: `u${index + 1}`, name, role: "Student" })), { id: "u6", name: "Noor van Dijk", role: "Docent" }],
  studentStatus: { "Lina Bakker": "Feedback verwerken", "Sem de Jong": "Wacht op feedback", "Yara Smit": "Niets ingeleverd", "Omar Aydin": "Op schema", "Fleur Visser": "Feedback verwerken" },
  assignmentProgress: defaultProgress(initialModules),
  assignmentFeedback: [{
    id: "af1",
    student: "Lina Bakker",
    assignment: "DESTEP-analyse",
    status: "Feedback ontvangen",
    feedback: "Je hebt bruikbare trends gevonden en je bronnen zijn helder vermeld.",
    nextStep: "Leg per trend uit wat deze concreet betekent voor de organisatie.",
    createdAt: "Vandaag",
  }],
  feedbackResponse: "",
  submissions: ["DESTEP-analyse â€“ versie 1.pdf"],
  notifications: [{ id: "n1", title: "Nieuwe feedback op DESTEP-analyse", read: false }, { id: "n2", title: "Feedbackmoment gepland op 8 juli", read: false }],
};

function normalizeState(candidate: Partial<DemoState>): DemoState {
  const modules = Array.isArray(candidate.modules) ? candidate.modules : initial.modules;
  const allAssignments = [...new Set(modules.flatMap((module) => module.assignments))];
  const currentProgress = candidate.assignmentProgress ?? {};
  const assignmentProgress = Object.fromEntries(demoStudents.map((student) => [
    student,
    Object.fromEntries(allAssignments.map((assignment) => [assignment, currentProgress[student]?.[assignment] ?? "Nog niet gestart"])),
  ]));
  return {
    ...initial,
    ...candidate,
    modules,
    assignmentProgress,
    assignmentFeedback: Array.isArray(candidate.assignmentFeedback) ? candidate.assignmentFeedback : initial.assignmentFeedback,
  };
}

type Ctx = {
  state: DemoState;
  addModule: (module: Omit<DemoModule, "id">) => void;
  updateModule: (id: string, module: Omit<DemoModule, "id">) => void;
  addMoment: (moment: Omit<DemoMoment, "id">) => void;
  addUser: (name: string, role: string) => void;
  setStudentStatus: (name: string, status: string) => void;
  saveAssignmentFeedback: (feedback: Omit<DemoAssignmentFeedback, "id" | "createdAt">) => void;
  respond: (text: string) => void;
  addSubmission: (name: string) => void;
  markRead: (id: string) => void;
  reset: () => void;
};

const DemoContext = createContext<Ctx | null>(null);

export function DemoStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("groeikompas-demo") ?? localStorage.getItem("groeiwijzer-demo");
    queueMicrotask(() => {
      if (saved) {
        try { setState(normalizeState(JSON.parse(saved))); } catch { /* Gebruik veilige voorbeeldgegevens. */ }
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem("groeikompas-demo", JSON.stringify(state));
  }, [hydrated, state]);

  const value = useMemo<Ctx>(() => ({
    state,
    addModule: (module) => setState((current) => normalizeState({ ...current, modules: [...current.modules, { ...module, id: crypto.randomUUID() }] })),
    updateModule: (id, module) => setState((current) => normalizeState({ ...current, modules: current.modules.map((item) => item.id === id ? { ...module, id } : item) })),
    addMoment: (moment) => setState((current) => ({ ...current, moments: [...current.moments, { ...moment, id: crypto.randomUUID() }], notifications: [...current.notifications, { id: crypto.randomUUID(), title: `Feedbackmoment gepland: ${moment.title}`, read: false }] })),
    addUser: (name, role) => setState((current) => ({ ...current, users: [...current.users, { id: crypto.randomUUID(), name, role }] })),
    setStudentStatus: (name, status) => setState((current) => ({ ...current, studentStatus: { ...current.studentStatus, [name]: status } })),
    saveAssignmentFeedback: (feedback) => setState((current) => ({
      ...current,
      assignmentProgress: { ...current.assignmentProgress, [feedback.student]: { ...current.assignmentProgress[feedback.student], [feedback.assignment]: feedback.status } },
      assignmentFeedback: [...current.assignmentFeedback, { ...feedback, id: crypto.randomUUID(), createdAt: new Date().toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) }],
      studentStatus: { ...current.studentStatus, [feedback.student]: "Feedback verwerken" },
      notifications: feedback.student === "Lina Bakker" ? [...current.notifications, { id: crypto.randomUUID(), title: `Nieuwe feedback op ${feedback.assignment}`, read: false }] : current.notifications,
    })),
    respond: (text) => setState((current) => ({ ...current, feedbackResponse: text, notifications: current.notifications.map((notification) => notification.id === "n1" ? { ...notification, read: true } : notification) })),
    addSubmission: (name) => setState((current) => ({ ...current, submissions: [...current.submissions, name] })),
    markRead: (id) => setState((current) => ({ ...current, notifications: current.notifications.map((notification) => notification.id === id ? { ...notification, read: true } : notification) })),
    reset: () => setState(initial),
  }), [state]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("DemoStateProvider ontbreekt");
  return value;
}

export function DemoResetButton() {
  const { reset } = useDemo();
  return <button onClick={reset} className="rounded-lg px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">Demo resetten</button>;
}

