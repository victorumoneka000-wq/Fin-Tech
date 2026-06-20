# 📊 Chatbot Intelligent de Gestion Budgétaire & d'Épargne

> **Projet Académique BAC 2 — Génie Logiciel / Intelligence Artificielle** > *Université Protestante de Lubumbashi (UPL) — Faculté des Sciences Informatiques*

---

## 📝 Présentation Générale

Cette application est une plateforme de **Gestion Budgétaire et d'Épargne Intelligente** conçue sous forme de tableau de bord analytique et interactif. Elle permet à un utilisateur de suivre ses revenus, de réguler ses enveloppes de dépenses (loyer, alimentation, loisirs, etc.) et de projeter sa croissance financière sur 12 mois.

La force majeure du projet réside dans son **double moteur d'automatisation et d'intelligence artificielle** :
1. **Conseiller Financier IA :** Alimenté par le modèle *Google Gemini*, il effectue des diagnostics sur mesure à partir de la situation budgétaire réelle de l'utilisateur.
2. **Synchronisation Workspace (Gmail API) :** Un module capable d'analyser les courriels récents pour y détecter automatiquement des factures ou reçus et en proposer l'enregistrement automatisé en un clic.

---

## 🏗️ Architecture & Structure du Projet

Le projet applique une architecture d'**Orchestration Centralisée par Composants Modulaires** sous TypeScript pour isoler la logique métier et optimiser la maintenance.

```text
📁 src/
│
├── 📂 components/            # Composants d'interface isolés et réutilisables
│   ├── 📄 AuthInterface.tsx   # Écran de connexion Supabase & mode hors-ligne
│   ├── 📄 DashboardTab.tsx   # Onglet d'aperçu général et de statistiques
│   ├── 📄 TransactionsTab.tsx# Registre de transactions & Import CSV robustes
│   ├── 📄 ProfileTab.tsx     # Configuration des enveloppes budgétaires
│   ├── 📄 ProjectionsTab.tsx # Simulateur prédictif et graphiques SVG natifs
│   ├── 📄 GmailTab.tsx       # Interface Gmail, scanning et validation des reçus
│   └── 📄 ConfirmModal.tsx   # Boîte de dialogue de confirmation globale
│
├── 📂 utils/                 # Utilitaires de traitement logique (ex: markdown)
├── 📂 types/                 # Définitions et interfaces TypeScript communes
├── 📄 App.tsx                # Chef d'orchestre : gestion du State global et du routage
└── 📄 main.tsx               # Point d'entrée de l'application React
