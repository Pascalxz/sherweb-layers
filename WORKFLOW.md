# WORKFLOW.md — Workflow de validation & RBAC

> Divergence assumée du PRD (décidée le 2026-05-29). Le CLAUDE.md §5 disait « pas de RBAC » ;
> on ajoute finalement un workflow de production avec rôles et permissions **appliquées**.

## Rôles

| Rôle | Responsabilité | Peut |
|---|---|---|
| `requester` | A demandé la tâche (= propriétaire de la génération par défaut) | Valider à l'étape finale, envoyer en dev/prod |
| `writer` | Texte | Éditer le texte, valider l'étape Texte |
| `designer` | Design | Éditer le design (canvas), valider l'étape Design |
| `coder` | Code | Valider/éditer le code généré, valider l'étape Code |
| `qa` | Qualité | Passe QA finale |
| `admin` | Méta | Gérer les rôles, tout débloquer |

Un utilisateur peut cumuler plusieurs rôles (table `user_roles`).

## Étapes (machine à états sur `generations.status`)

```
draft
  └─(submit, par le demandeur)──────────▶ text_review
text_review        (writer)   approve ─▶ design_review     reject ─▶ corrections
design_review      (designer) approve ─▶ code_review       reject ─▶ corrections
code_review        (coder)    approve ─▶ qa                reject ─▶ corrections
qa                 (qa)       approve ─▶ requester_validation  reject ─▶ corrections
requester_validation (requester) approve ─▶ ready_dev      reject ─▶ corrections
ready_dev          (requester) ship ────▶ published
corrections        (demandeur/éditeur) resubmit ─▶ text_review
```

## Permissions (appliquées)

- **Avancer/valider une étape** : le serveur (`/api/workflow/[id]`) vérifie que l'utilisateur
  détient le rôle de l'étape courante (fonction SQL `has_role`). Sinon `403`.
- **Approbations loggées** : `generation_reviews` (RLS `with check (action='comment' OR has_role(role))`).
- **Éditer le contenu** : la sauvegarde canvas (`PATCH /api/generations/[id]`) exige le rôle
  `designer` ou `coder` (ou propriétaire). Un `writer` n'édite que le texte.
- **Commentaires/retours** : autorisés à tous (action `comment`).

## Tables

- `user_roles(user_id, role)` — RLS lecture auth ; écriture auth (gestion des rôles en démo).
- `generations.status` — étape courante.
- `generation_reviews(id, generation_id, stage, action, role, user_id, comment, created_at)`.
- `public.has_role(text) → boolean` — security definer, lit `user_roles` pour `auth.uid()`.

## Démo avec un seul compte

Le RBAC dur ne « se voit » qu'avec plusieurs comptes. Pour la démo : assigne-toi un sous-ensemble
de rôles (vue **Rôles**) pour constater le blocage, ou invite des collègues (magic link) et
assigne-leur writer/designer/coder/qa.
