# CLAUDE.md — Sherweb Layer (Demo Interne)

> Instructions de comportement persistantes pour Claude Code.
> Lis ce fichier en entier avant chaque session de travail. Le PRD complet
> (`PRD_SHERWEB_LAYER.md`) reste la spec de référence — ce fichier-ci dit *comment* travailler.

---

## Le projet en une phrase

Une démo interne **fonctionnelle et multi-utilisateurs** qui matérialise la « Sherweb Layer » :
une couche d'intelligence/contrôle qui injecte le contexte de marque Sherweb entre n'importe quel
moteur IA (Claude, OpenAI…) et l'output, pour produire du contenu **on-brand** éditable dans un canvas.

Objectif réel : **pitcher l'idée en interne**, mais avec du vrai (vrais appels API, vrais users, vrais outputs).
Pas un produit fini. Une démo crédible.

---

## Règles de comportement (non négociables)

1. **Jamais d'appel à un modèle « nu ».** Tout appel à Claude/OpenAI passe OBLIGATOIREMENT par le
   `contextBuilder` qui injecte le system prompt enrichi (tone of voice, design tokens, governance).
   C'est tout le sujet de la démo. Un appel direct sans la couche = bug, pas un raccourci.

2. **Couper la largeur, jamais la profondeur.** Si tu manques de temps : réduis le NOMBRE de features
   (2 outputs au lieu de 6), mais chaque feature livrée doit être complète et solide. Mieux vaut
   « email + brief » parfaits que 6 outputs à moitié branchés.

3. **Ordre des phases imposé.** Suis les 4 phases du PRD dans l'ordre. Chaque phase doit être
   testable et déployée avant de passer à la suivante. Pas de phase 3 si la phase 1 n'est pas verte.

4. **On-brand par construction.** Les couleurs, la typo, le ton viennent du skill `sherweb-brand`
   et du fichier de seed. N'invente jamais une couleur ou un message. En cas de doute → seed.

5. **Multi-users = simple.** Un seul rôle. Tout le monde voit tout (historique partagé). NE PAS
   sur-investir dans les permissions/RBAC. L'effet « regarde l'activité de l'équipe » est plus
   convaincant qu'un système de rôles pour une démo.

6. **HTML structuré, pas du markup libre.** Quand la couche génère du HTML (email, landing, brief),
   elle ASSEMBLE des composants d'une librairie fixe (hero, CTA, bloc texte, carte produit). Jamais
   de markup inventé librement — sinon GrapesJS/l'éditeur ne peut pas le parser proprement.

7. **Secrets côté serveur uniquement.** Clés API jamais exposées au client. Tous les appels modèles
   passent par des Route Handlers Next.js (`/app/api/...`). Jamais de clé dans un composant client.

8. **Demande avant de pivoter.** Si une décision d'architecture diverge du PRD (changer de lib,
   d'embedding, de provider), arrête-toi et demande. Ne pivote pas silencieusement.

---

## Stack (figée)

- **Next.js 14** App Router, TypeScript, déploiement **Vercel**
- **Supabase** région `ca-central-1` : Auth (magic link) + Postgres + **pgvector**
- **Claude API** moteur principal (ZDR activé) ; **OpenAI** optionnel pour démontrer le multi-engine
- **Embeddings : OpenAI `text-embedding-3-small` → dimension 1536** (figé, voir schéma)
- **Canvas : GrapesJS** (import dynamique, `ssr: false`) + **Monaco** pour la vue code
- **Tailwind** avec les tokens Sherweb (Montserrat, Blue 600 `#0076cb`, Red 600 `#db4227`)

---

## Architecture des appels (le cœur)

```
User prompt
   │
   ▼
contextBuilder()  ← injecte : tone of voice EN/FR + design tokens + governance rules
   │                + RAG (knowledge_chunks pertinents via similarité pgvector)
   ▼
Moteur (Claude / OpenAI)  ← appel serveur, clé jamais exposée
   │
   ▼
Output HTML structuré (assemblage de composants fixes)
   │
   ▼
Canvas (GrapesJS preview + édition) / Monaco (code) / Preview iframe
   │
   ▼
Persistance Supabase (generations) — historique partagé
```

**Si tu ajoutes un nouveau type d'output, il DOIT passer par ce pipeline.**

---

## Conventions de code

- **TypeScript strict.** Pas de `any` sauf justifié en commentaire.
- **Server Components par défaut**, `"use client"` seulement quand nécessaire (GrapesJS, Monaco, formulaires interactifs).
- **GrapesJS et Monaco : toujours en `dynamic(() => import(...), { ssr: false })`.** Ils cassent en SSR.
- **Pas de `<form>` HTML classique** dans les composants interactifs critiques — handlers `onClick`/`onChange`.
- Nommage : composants `PascalCase`, fichiers utils `camelCase`, routes API en `kebab-case`.
- Toute requête DB pertinente respecte le **RLS** (voir schéma) — ne le désactive pas pour aller plus vite.
- Commits courts et atomiques, un par sous-tâche testable.

---

## Définition de « terminé » (par phase)

Une phase n'est PAS terminée tant que :
- [ ] Le code compile sans erreur TS
- [ ] C'est déployé sur Vercel et accessible
- [ ] Un user (toi) peut faire le parcours de bout en bout sans erreur console
- [ ] Les critères de succès de la phase dans le PRD sont cochés

---

## Pièges connus (déjà identifiés)

- **GrapesJS en SSR → crash.** Toujours import dynamique client-only.
- **Le vrai défi n'est pas GrapesJS, c'est la régularité du HTML généré.** Investis dans un bon
  system prompt qui sort toujours les mêmes classes/wrappers. C'est là que se joue l'éditabilité.
- **pgvector : la dimension doit matcher l'embedding (1536).** Une incohérence = erreurs d'insertion silencieuses.
- **Ne pas sur-construire les permissions.** Time-sink classique pour zéro valeur en démo.
- **ZDR sur l'API Claude** doit être confirmé côté config avant la première vraie génération.

---

## Ce qu'on NE fait PAS dans cette démo

- Pas de RBAC / rôles multiples
- Pas de classifieur NLP de conformité (la gouvernance = injection par prompt, pas un modèle de validation)
- Pas les 6 outputs du diagramme — on cible **email + brief** (+ un 3e « wow » si le temps le permet)
- Pas de facturation, pas d'onboarding automatisé, pas de sync incrémentale complète du RAG
  (quelques chunks vectorisés suffisent à démontrer le concept)

---

## Source de vérité marque

Toutes les valeurs de marque (couleurs, typo, ton, messaging, proof points) viennent du
skill **`sherweb-brand`** et sont matérialisées dans **`seed.ts`**. En cas de conflit ou de doute,
le skill `sherweb-brand` tranche. Ne hardcode pas de valeurs ailleurs — référence le seed.
