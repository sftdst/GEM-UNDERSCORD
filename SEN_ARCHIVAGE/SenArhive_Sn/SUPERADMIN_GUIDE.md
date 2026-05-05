# Guide SuperAdmin SaaS - SenArchive

## 📋 Résumé Fonctionnalités SuperAdmin

Le système SuperAdmin vous permet de gérer :

### 1. **Dashboard SuperAdmin** (`/superadmin`)
- Vue d'ensemble des statistiques clés (organisations, utilisateurs, abonnements, revenu)
- Graphiques de distribution des plans
- Renouvellements à venir (30 jours)
- Liste des organisations récentes

### 2. **Gestion des Organisations** (`/superadmin/organisations`)
- **Créer** une nouvelle organisation (avec administrateur associé)
- **Voir** les détails d'une organisation
- **Éditer** les informations d'une organisation
- **Suspendre/Réactiver** une organisation
- **Supprimer** une organisation (soft delete)

### 3. **Gestion des Abonnements** (`/superadmin/abonnements`)
- **Lister** tous les abonnements filtrable par statut
- **Renouveler** un abonnement
- **Suspendre/Réactiver** un abonnement
- **Terminer** un abonnement
- **Voir les factures** associées à un abonnement

### 4. **Gestion des Demandes d'Abonnement** (`/superadmin/demandes_abonnement`)
- **Voir les demandes** en attente (en, approuvées, rejetées)
- **Approuver une demande** : crée automatiquement l'organisation, le rôle admin, l'utilisateur et l'abonnement
- **Rejeter une demande** avec raison

---

## 🔐 Authentification SuperAdmin

### Identifiants de Test

**Email:** `superadmin@senarchive.sn`  
**Mot de passe:** `SuperAdmin@2025`

### Points d'Entrée

- `/superadmin` - Tableau de bord
- `/superadmin/organisations` - Gestion organisations
- `/superadmin/abonnements` - Gestion abonnements
- `/superadmin/demandes_abonnement` - Gestion demandes

---

## 🚀 Étapes de Test

### ✅ Test 1 : Accès au Dashboard
1. Ouvrir `http://127.0.0.1:8000/superadmin`
2. Vérifier l'affichage du dashboard avec les statistiques

### ✅ Test 2 : Créer une Organisation
1. Aller à `/superadmin/organisations` → "Nouvelle organisation"
2. Remplir le formulaire :
   - Nom: "Ministère de la Santé"
   - Slug: "ministere-sante" (auto-généré)
   - Plan: Sélectionner un plan
3. Ajouter un administrateur
4. Valider → une organisation est créée

### ✅ Test 3 : Voir Détails Organisation
1. Cliquer sur "Voir" sur une organisation
2. Vérifier l'affichage :
   - Informations org
   - Plan appliqué
   - Nombre utilisateurs/documents
   - Statut

### ✅ Test 4 : Gérer les Abonnements
1. Aller à `/superadmin/abonnements`
2. Cliquer sur un abonnement
3. Actions possibles:
   - Renouveler
   - Suspendre/Réactiver
   - Terminer
   - Voir les factures

### ✅ Test 5 : Approuver une Demande
1. Aller à `/superadmin/demandes_abonnement`
2. Cliquer "Approuver" sur une demande
3. Vérifier que :
   - Une organisation est créée
   - Un administrateur avec mot de passe temp est crée
   - Un abonnement est créé automatiquement

---

## 📦 Architecture Implémentée

### Models Créés
- `SuperAdmin` - Modèle d'authentification SuperAdmin

### Controllers Créés
- `SuperAdmin\DashboardController` - Dashboard
- `SuperAdmin\OrganisationController` - CRUD organisations
- `SuperAdmin\AbonnementController` - CRUD abonnements
- `SuperAdmin\DemandeAbonnementController` - Gestion demandes

### Middleware
- `IsSuperAdmin` - Vérifie authentification + statut actif

### Routes
- Toutes préfixées par `/superadmin`
- Middleware: `auth:superadmin`, `is_super_admin`

### Views React/TypeScript
- `superadmin/dashboard.tsx`
- `superadmin/organisations/index.tsx`
- `superadmin/organisations/create.tsx`
- `superadmin/demandes_abonnement/index.tsx`
- Layout: `superadmin-layout.tsx`

---

## 🔧 Commandes Utiles

```bash
# Exécuter les migrations
php artisan migrate

# Seeder le SuperAdmin
php artisan db:seed --class=SuperAdminSeeder

# Builder les assets
npm run build

# Relancer le serveur
php artisan serve --host=127.0.0.1 --port=8000
```

---

## 📊 Flux de Données SaaS

1. **Demande d'Abonnement** → SuperAdmin reçoit demande
2. **Approbation** → Crée Org + Admin + Abonnement
3. **Utilisation** → Org peut créer documents/services
4. **Renouvellement** → SuperAdmin renouvelle abonnement

---

## 🎯 Prochaines Étapes Recommandées

1. ✅ Ajouter page de **login SuperAdmin** (actuellement héritée)
2. ✅ Implémenter **gestion des Plans** (créer/éditer/supprimer)
3. ✅ Ajouter **rapports & analytics** avancés
4. ✅ Automatiser les **relances de renouvellement**
5. ✅ Ajouter **audit trail** complet des actions SuperAdmin

---

## ⚠️ Notes Importantes

- Les **demandes d'abonnement** sont lues en cache (statiques pour test)
- À implémenter: **vraie table DemandeAbonnement** avec migration + model
- **Soft delete** activé pour organisations
- Les mots de passe temporaires doivent être communiqués par email (configurable)

