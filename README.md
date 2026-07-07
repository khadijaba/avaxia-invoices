# AVAXIA — Plateforme d'Intégration et de Gestion des Factures SAP

Plateforme web permettant de synchroniser, consulter et payer des factures issues d'un système **SAP ECC** via des modules de fonction **RFC**, avec un backend **SAP CAP (Node.js)** et un tableau de bord **React** au style SAP Fiori.

Projet réalisé dans le cadre d'un Projet de Fin d'Études (PFE).

---

## 🎯 Objectif du projet

Automatiser et centraliser la gestion des factures fournisseurs d'AVAXIA Group en connectant directement une application web moderne au système SAP ECC de l'entreprise, sans intervention manuelle dans SAP GUI pour les opérations courantes (consultation, vérification, paiement).

---

## 🏗️ Architecture

```
┌─────────────────────┐        ┌──────────────────────┐        ┌─────────────────┐
│   Frontend React     │  HTTP  │   Backend SAP CAP     │  RFC   │   SAP ECC       │
│   (avaxia-invoices)  │ ─────► │   (avaxia-cap)         │ ─────► │   (BKPF, BSEG)  │
│   Dashboard Fiori     │ ◄───── │   Node.js + node-rfc  │ ◄───── │   Function      │
│                       │ OData  │   SQLite (cache local) │        │   Modules Z*    │
└─────────────────────┘        └──────────────────────┘        └─────────────────┘
```

**Flux principal :**
1. Le backend appelle les function modules ABAP personnalisés (`ZAVAXIA_GET_INVOICES`, `ZAVAXIA_CHECK_INVOICE`, `ZAVAXIA_PAY_INVOICE`) via RFC.
2. Les données sont mises en cache localement dans une base SQLite (via SAP CAP) pour un affichage rapide.
3. Toute action (consultation, vérification, paiement) est journalisée (`Log`) et historisée (`Hist`).
4. Un scheduler interne exécute des routines automatiques (synchronisation périodique, détection des factures en retard).
5. Le frontend React consomme l'API OData exposée par CAP et affiche un dashboard interactif.

---

## 📁 Structure du dépôt

```
avaxia-invoices/          # Frontend React (dashboard, authentification, pages)
├── src/
│   ├── pages/            # AdminDashboard, UserDashboard, Login, InvoiceDetail...
│   ├── components/        # Navbar, InvoiceTable, ProtectedRoute
│   ├── services/api.js    # Appels HTTP vers le backend CAP
│   └── context/            # AuthContext, ThemeContext
│
avaxia-cap/                # Backend SAP CAP (Node.js)
├── db/
│   ├── schema.cds          # Modèle de données (Invoices, Users, Log, Hist, Routine)
│   └── data/                # Données de démonstration (CSV)
├── srv/
│   ├── service.cds          # Service OData exposé (/api)
│   ├── service.js           # Handlers métier (Pay, Check, READ)
│   ├── rfc.js                # Connexion RFC vers SAP ECC (node-rfc)
│   └── scheduler.js         # Routines planifiées (sync auto, détection retard)
├── server.js                # Bootstrap Express (auth JWT, health check SAP)
└── package.json
```

---

## ⚙️ Fonctionnalités

### Intégration SAP ECC (RFC)
- **GET** — récupération des factures réelles depuis `BKPF`/`BSEG` (fournisseur, montant, devise).
- **CHECK** — vérification du statut de paiement d'une facture.
- **PAY** — déclenchement du paiement, avec protection anti-double-paiement.
- **Health check** — indicateur en direct de la disponibilité de SAP ECC sur le dashboard.

### Gestion multi-devise
- Les montants sont conservés dans leur **devise d'origine** (USD, EUR, TND...) et jamais additionnés entre devises différentes.
- KPI, graphiques et tableau affichent une décomposition explicite par devise.

### Traçabilité complète
- **Log** — journal de tous les appels (GET/CHECK/PAY), avec résultat et message.
- **Hist** — historique des changements de statut de chaque facture.

### Automatisation
- **Routine "Synchronisation factures ECC"** — resynchronise les factures depuis SAP toutes les 30 minutes.
- **Routine "Vérification factures en retard"** — détecte chaque nuit à minuit les factures impayées depuis plus de 30 jours.

### Dashboard administrateur
- KPI (montant total, factures payées/impayées, taux de paiement basé sur le nombre de factures).
- Graphiques : top 5 fournisseurs (empilé par devise), répartition par statut, évolution mensuelle.
- Table de gestion des factures avec recherche et filtres.
- Authentification par rôle (JWT).

---

## 🛠️ Stack technique

| Composant | Technologie |
|---|---|
| Backend | Node.js, SAP CAP (`@sap/cds`), Express |
| Connexion SAP | `node-rfc` (SAP NetWeaver RFC SDK) |
| Base de données | SQLite (in-memory, via `@cap-js/sqlite`) |
| Authentification | JWT (`jsonwebtoken`), `bcryptjs` |
| Planification | `node-cron` |
| Frontend | React, `@ui5/webcomponents-react` (style Fiori), `recharts` |
| SAP | ECC, function modules ABAP RFC-enabled personnalisés (`ZAVAXIA_*`) |

---

## 🚀 Installation

### Prérequis
- Node.js ≥ 18
- Un accès à un système **SAP ECC** avec les function modules `ZAVAXIA_GET_INVOICES`, `ZAVAXIA_CHECK_INVOICE`, `ZAVAXIA_PAY_INVOICE` déployés et RFC-enabled.
- Le **SAP NetWeaver RFC SDK** installé localement (requis par `node-rfc`), avec la variable d'environnement `SAPNWRFC_HOME` configurée et le dossier `lib/` du SDK ajouté au `PATH`.

### Backend (`avaxia-cap`)

```bash
cd avaxia-cap
npm install
```

Crée un fichier `.env` à la racine avec les informations de connexion SAP :
```env
SAP_ASHOST=<adresse IP ou hostname du serveur SAP>
SAP_SYSID=<ID système>
SAP_SYSNR=<numéro d'instance>
SAP_CLIENT=<mandant>
SAP_USER=<utilisateur RFC>
SAP_PASS=<mot de passe>
SAP_LANG=FR
```

Lance le serveur :
```bash
cds watch
```
Le backend démarre sur `http://localhost:4004`.

### Frontend (`avaxia-invoices`)

```bash
cd avaxia-invoices
npm install
npm start
```
Le frontend démarre sur `http://localhost:3000`.

---

## 🔌 Endpoints principaux

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/Invoices` | Liste des factures (synchronisées depuis SAP ECC) |
| POST | `/api/Check` | Vérifie le statut d'une facture (`{ invoiceId }`) |
| POST | `/api/Pay` | Déclenche le paiement d'une facture (`{ invoiceId }`) |
| GET | `/api/Log` | Journal des actions |
| GET | `/api/Hist` | Historique des changements de statut |
| GET | `/api/Routine` | Liste des routines planifiées |
| GET | `/health/sap` | Statut de connexion en direct à SAP ECC |
| POST | `/auth/login` | Authentification utilisateur (JWT) |
| POST | `/auth/register` | Création de compte |

---

## 🧩 Points techniques notables

- **Anti-double-paiement** : toute tentative de paiement sur une facture déjà payée est rejetée côté ABAP, avec journalisation de l'échec.
- **Résilience réseau** : si SAP ECC est injoignable, les routines automatiques échouent proprement (journalisées en erreur) sans interrompre le reste de l'application ; le badge de statut sur le dashboard reflète la disponibilité en temps réel.
- **Rigueur multi-devise** : aucun montant n'est jamais additionné entre devises différentes ; le taux de paiement est calculé sur le nombre de factures plutôt que sur les montants pour rester valide indépendamment des devises en présence.

---

## 📌 Limites connues / axes d'amélioration

- Pas de workflow d'approbation multi-niveaux (validation manager/directeur).
- Pas de conversion de devises (les montants restent affichés dans leur devise d'origine, sans taux de change).
- Authentification simplifiée (JWT stocké en clair côté client, à renforcer pour un usage en production).

---

## 👤 Auteur

Projet réalisé par **Khadija Benayed** dans le cadre d'un Projet de Fin d'Études.
