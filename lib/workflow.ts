// workflow.ts — modèle partagé du workflow de validation + RBAC. Client + serveur.

export type Role = "requester" | "writer" | "designer" | "coder" | "qa" | "admin";

export const ROLES: { id: Role; label: string; icon: string; color: string }[] = [
  { id: "requester", label: "Demandeur", icon: "fa-flag", color: "#0061AA" },
  { id: "writer", label: "Rédacteur", icon: "fa-pen-nib", color: "#0A96ED" },
  { id: "designer", label: "Designer", icon: "fa-pen-ruler", color: "#7C3AED" },
  { id: "coder", label: "Développeur", icon: "fa-code", color: "#1F8A5B" },
  { id: "qa", label: "QA", icon: "fa-clipboard-check", color: "#D97706" },
  { id: "admin", label: "Admin", icon: "fa-user-shield", color: "#DB4227" },
];

export type Status =
  | "draft"
  | "text_review"
  | "design_review"
  | "code_review"
  | "qa"
  | "requester_validation"
  | "corrections"
  | "ready_dev"
  | "published";

export interface StageDef {
  status: Status;
  label: string;
  short: string;
  role: Role | null; // rôle requis pour valider cette étape (null = pas de validation)
  icon: string;
}

// Étapes ordonnées du pipeline (hors 'corrections' qui est un état latéral).
export const STAGES: StageDef[] = [
  { status: "draft", label: "Brouillon", short: "Brouillon", role: null, icon: "fa-file" },
  { status: "text_review", label: "Révision texte", short: "Texte", role: "writer", icon: "fa-pen-nib" },
  { status: "design_review", label: "Révision design", short: "Design", role: "designer", icon: "fa-pen-ruler" },
  { status: "code_review", label: "Révision code", short: "Code", role: "coder", icon: "fa-code" },
  { status: "qa", label: "Contrôle QA", short: "QA", role: "qa", icon: "fa-clipboard-check" },
  { status: "requester_validation", label: "Validation demandeur", short: "Validation", role: "requester", icon: "fa-flag" },
  { status: "ready_dev", label: "Prêt pour dev", short: "Dev", role: "requester", icon: "fa-rocket" },
  { status: "published", label: "Publié (prod)", short: "Prod", role: null, icon: "fa-circle-check" },
];

export const stageDef = (s: string): StageDef | undefined => STAGES.find((x) => x.status === s);
export const roleMeta = (r: string) => ROLES.find((x) => x.id === r);

// Étape suivante sur approbation.
const NEXT: Record<Status, Status | null> = {
  draft: "text_review",
  text_review: "design_review",
  design_review: "code_review",
  code_review: "qa",
  qa: "requester_validation",
  requester_validation: "ready_dev",
  ready_dev: "published",
  corrections: "text_review",
  published: null,
};
export const nextStatus = (s: Status): Status | null => NEXT[s];

// Le rôle requis pour AGIR sur l'état courant (submit/approve/ship).
export function roleForStatus(s: Status): Role | null {
  if (s === "draft" || s === "corrections") return "requester"; // submit/resubmit par le demandeur
  return stageDef(s)?.role ?? null;
}

export const STATUS_BADGE: Record<Status, { label: string; cat: "legal" | "brand" | "compliance" | "muted" }> = {
  draft: { label: "Brouillon", cat: "muted" },
  text_review: { label: "Révision texte", cat: "brand" },
  design_review: { label: "Révision design", cat: "brand" },
  code_review: { label: "Révision code", cat: "brand" },
  qa: { label: "QA", cat: "compliance" },
  requester_validation: { label: "Validation", cat: "compliance" },
  corrections: { label: "Corrections", cat: "legal" },
  ready_dev: { label: "Prêt dev", cat: "compliance" },
  published: { label: "Publié", cat: "compliance" },
};
