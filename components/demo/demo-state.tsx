"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const demoStudents = ["Lina Bakker", "Sem de Jong", "Yara Smit", "Omar Aydin", "Fleur Visser"];
export const demoClasses = ["Marketing & Communicatie 4A", "Marketing & Communicatie 4B"];
export const demoStudentClasses: Record<string, string> = {
  "Lina Bakker": "Marketing & Communicatie 4A",
  "Sem de Jong": "Marketing & Communicatie 4A",
  "Yara Smit": "Marketing & Communicatie 4A",
  "Omar Aydin": "Marketing & Communicatie 4B",
  "Fleur Visser": "Marketing & Communicatie 4B",
};
export const demoAssignmentStatuses = ["Nog niet gestart", "Bezig", "Ingeleverd", "Feedback ontvangen", "Afgerond"] as const;
export type DemoAssignmentStatus = (typeof demoAssignmentStatuses)[number];
export type DemoModule = {
  id: string;
  title: string;
  description: string;
  period: string;
  assignments: string[];
  published: boolean;
  archived: boolean;
  cohorts: string[];
};
export type DemoMoment = { id: string; title: string; date: string; kind: string; cohort: string };
export type DemoAssignmentFeedback = {
  id: string;
  student: string;
  assignment: string;
  status: DemoAssignmentStatus;
  feedback: string;
  nextStep: string;
  createdAt: string;
  response?: string;
};

type DemoNotification = { id: string; title: string; read: boolean; assignment?: string };
type DemoState = {
  modules: DemoModule[];
  moments: DemoMoment[];
  users: { id: string; name: string; role: string }[];
  studentStatus: Record<string, string>;
  assignmentProgress: Record<string, Record<string, DemoAssignmentStatus>>;
  assignmentFeedback: DemoAssignmentFeedback[];
  assignmentSubmissions: Record<string, string[]>;
  learningGoals: Record<string, string[]>;
  notifications: DemoNotification[];
};

const initialModules: DemoModule[] = [
  { id: "m1", title: "Omgevingsonderzoek", description: "Van trends naar een heldere analyse.", period: "Periode 1", assignments: ["DESTEP-analyse", "SWOT-analyse", "Doelgroepanalyse"], published: true, archived: false, cohorts: [demoClasses[0]] },
  { id: "m2", title: "Van analyse naar advies", description: "Onderbouw een advies en maak een passende uiting.", period: "Periode 2", assignments: ["Adviesposter", "Adviespresentatie"], published: true, archived: false, cohorts: demoClasses },
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
    { id: "f1", title: "Snelle check DESTEP-bronnen", date: "8 juli, 10:00", kind: "Snelle check", cohort: demoClasses[0] },
    { id: "f2", title: "Peerfeedback adviesposter", date: "15 juli, 13:30", kind: "Feedback van medestudent", cohort: demoClasses[0] },
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
  assignmentSubmissions: { "DESTEP-analyse": ["DESTEP-analyse â€“ versie 1.pdf"] },
  learningGoals: {
    "DESTEP-analyse": ["Trends onderzoeken", "Betrouwbare bronnen gebruiken"],
    "SWOT-analyse": ["Informatie analyseren", "Sterktes en risico's afwegen"],
    "Doelgroepanalyse": ["Doelgroepbehoeften herkennen"],
    "Adviesposter": ["Advies helder visualiseren"],
    "Adviespresentatie": ["Keuzes onderbouwen", "Professioneel presenteren"],
  },
  notifications: [
    { id: "n1", title: "Nieuwe feedback op DESTEP-analyse", read: false, assignment: "DESTEP-analyse" },
    { id: "n2", title: "Feedbackmoment voor DESTEP-analyse gepland", read: false, assignment: "DESTEP-analyse" },
  ],
};

type LegacyState = Partial<DemoState> & { feedbackResponse?: string; submissions?: string[] };

function normalizeState(candidate: LegacyState): DemoState {
  const modules = (Array.isArray(candidate.modules) ? candidate.modules : initial.modules).map((module) => ({
    ...module,
    published: module.published ?? true,
    archived: module.archived ?? false,
    cohorts: module.cohorts ?? demoClasses,
  }));
  const allAssignments = [...new Set(modules.flatMap((module) => module.assignments))];
  const currentProgress = candidate.assignmentProgress ?? {};
  const assignmentProgress = Object.fromEntries(demoStudents.map((student) => [
    student,
    Object.fromEntries(allAssignments.map((assignment) => [assignment, currentProgress[student]?.[assignment] ?? "Nog niet gestart"])),
  ]));
  const assignmentFeedback = (Array.isArray(candidate.assignmentFeedback) ? candidate.assignmentFeedback : initial.assignmentFeedback)
    .map((feedback) => feedback.id === "af1" && candidate.feedbackResponse ? { ...feedback, response: candidate.feedbackResponse } : feedback);
  return {
    ...initial,
    ...candidate,
    modules,
    assignmentProgress,
    assignmentFeedback,
    assignmentSubmissions: candidate.assignmentSubmissions ?? { "DESTEP-analyse": candidate.submissions ?? initial.assignmentSubmissions["DESTEP-analyse"] },
    learningGoals: candidate.learningGoals ?? initial.learningGoals,
    notifications: (candidate.notifications ?? initial.notifications).map((notification) => ({ ...notification, assignment: notification.assignment ?? (notification.title.includes("DESTEP") ? "DESTEP-analyse" : undefined) })),
  };
}

type Ctx = {
  state: DemoState;
  addModule: (module: Omit<DemoModule, "id">) => void;
  updateModule: (id: string, module: Omit<DemoModule, "id">) => void;
  addMoment: (moment: Omit<DemoMoment, "id">) => void;
  addUser: (name: string, role: string) => void;
  setAssignmentStatus: (student: string, assignment: string, status: DemoAssignmentStatus) => void;
  saveAssignmentFeedback: (feedback: Omit<DemoAssignmentFeedback, "id" | "createdAt" | "response">) => void;
  respond: (feedbackId: string, text: string) => void;
  addSubmission: (assignment: string, name: string) => void;
  markRead: (id: string) => void;
  setModulePublished: (id: string, published: boolean) => void;
  archiveModule: (id: string) => void;
  moveAssignment: (moduleId: string, assignment: string, direction: -1 | 1) => void;
};

const DemoContext = createContext<Ctx | null>(null);

export function DemoStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("groeikompas-demo") ?? localStorage.getItem("groeiwijzer-demo");
    queueMicrotask(() => {
      if (saved) {
        try { setState(normalizeState(JSON.parse(saved))); } catch { /* Behoud de bestaande opleidingsgegevens. */ }
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
    setAssignmentStatus: (student, assignment, status) => setState((current) => ({ ...current, assignmentProgress: { ...current.assignmentProgress, [student]: { ...current.assignmentProgress[student], [assignment]: status } } })),
    saveAssignmentFeedback: (feedback) => setState((current) => ({
      ...current,
      assignmentProgress: { ...current.assignmentProgress, [feedback.student]: { ...current.assignmentProgress[feedback.student], [feedback.assignment]: "Feedback ontvangen" } },
      assignmentFeedback: [...current.assignmentFeedback, { ...feedback, status: "Feedback ontvangen", id: crypto.randomUUID(), createdAt: new Date().toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) }],
      studentStatus: { ...current.studentStatus, [feedback.student]: "Feedback verwerken" },
      notifications: feedback.student === "Lina Bakker" ? [...current.notifications, { id: crypto.randomUUID(), title: `Nieuwe feedback op ${feedback.assignment}`, read: false, assignment: feedback.assignment }] : current.notifications,
    })),
    respond: (feedbackId, text) => setState((current) => {
      const feedback = current.assignmentFeedback.find((item) => item.id === feedbackId);
      if (!feedback) return current;
      return {
        ...current,
        assignmentFeedback: current.assignmentFeedback.map((item) => item.id === feedbackId ? { ...item, response: text } : item),
        assignmentProgress: { ...current.assignmentProgress, [feedback.student]: { ...current.assignmentProgress[feedback.student], [feedback.assignment]: "Afgerond" } },
        studentStatus: { ...current.studentStatus, [feedback.student]: "Op schema" },
        notifications: current.notifications.map((notification) => notification.assignment === feedback.assignment ? { ...notification, read: true } : notification),
      };
    }),
    addSubmission: (assignment, name) => setState((current) => ({
      ...current,
      assignmentSubmissions: { ...current.assignmentSubmissions, [assignment]: [...(current.assignmentSubmissions[assignment] ?? []), name] },
      assignmentProgress: { ...current.assignmentProgress, "Lina Bakker": { ...current.assignmentProgress["Lina Bakker"], [assignment]: "Ingeleverd" } },
    })),
    markRead: (id) => setState((current) => ({ ...current, notifications: current.notifications.map((notification) => notification.id === id ? { ...notification, read: true } : notification) })),
    setModulePublished: (id, published) => setState((current) => ({ ...current, modules: current.modules.map((module) => module.id === id ? { ...module, published } : module) })),
    archiveModule: (id) => setState((current) => ({ ...current, modules: current.modules.map((module) => module.id === id ? (module.archived ? { ...module, archived: false } : { ...module, archived: true, published: false }) : module) })),
    moveAssignment: (moduleId, assignment, direction) => setState((current) => ({ ...current, modules: current.modules.map((module) => {
      if (module.id !== moduleId) return module;
      const index = module.assignments.indexOf(assignment); const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= module.assignments.length) return module;
      const assignments = [...module.assignments]; [assignments[index], assignments[nextIndex]] = [assignments[nextIndex], assignments[index]];
      return { ...module, assignments };
    }) })),
  }), [state]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("DemoStateProvider ontbreekt");
  return value;
}

