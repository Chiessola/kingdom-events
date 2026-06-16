# Kingdom Events Cameroun — Guide de Déploiement

Ce dossier contient le code complet de ta plateforme, connecté à ta base Supabase.
Suis ces étapes DANS L'ORDRE.

---

## ÉTAPE 1 — Créer le bucket de stockage dans Supabase (pour les photos/vidéos)

1. Va sur ton tableau de bord Supabase (supabase.com → ton projet)
2. Dans le menu de gauche, clique sur **Storage**
3. Clique sur **New bucket**
4. Nom du bucket : `evenements-medias` (exactement ce nom, sans majuscule)
5. Active **Public bucket** (pour que les photos soient visibles sur le site)
6. Clique **Create bucket**

### Donner les permissions d'upload au bucket

1. Toujours dans Storage, clique sur ton bucket `evenements-medias`
2. Clique sur **Policies** (en haut)
3. Clique **New Policy** → **For full customization**
4. Crée une politique avec :
   - Nom : `Permettre upload authentifié`
   - Allowed operation : `INSERT`
   - Target roles : `authenticated`
   - USING expression : laisse vide
   - WITH CHECK expression : `true`
5. Clique **Review** puis **Save policy**
6. Refais la même chose mais avec Allowed operation : `SELECT` et Target roles : `public` (pour que tout le monde puisse VOIR les photos)

---

## ÉTAPE 2 — Créer ton compte administrateur

1. Va d'abord sur le site une fois déployé (étape 4) et clique "Organisateurs" → "Créer un compte"
2. Inscris-toi avec ton propre email, ex: `admin@kingdom.cm` (ou ton vrai email)
3. Retourne dans Supabase → **SQL Editor** → New query
4. Colle et exécute ce code (remplace l'email par celui que tu as utilisé) :

```sql
UPDATE profils SET role = 'admin' WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@kingdom.cm'
);
```

5. Ton compte a maintenant les droits administrateur. Tu peux te connecter via le bouton "Admin" du site avec cet email et le mot de passe que tu as choisi.

---

## ÉTAPE 3 — Désactiver la confirmation par email (optionnel, pour aller plus vite)

Par défaut, Supabase envoie un email de confirmation après inscription. Pour les tests, tu peux désactiver ça :

1. Supabase → **Authentication** → **Providers** → **Email**
2. Désactive **Confirm email**
3. Sauvegarde

(Tu peux le réactiver plus tard quand le site est en production réelle.)

---

## ÉTAPE 4 — Déployer le site sur Vercel (gratuit)

### A. Mettre le code sur GitHub

1. Va sur [github.com](https://github.com) et crée un compte si tu n'en as pas
2. Clique **New repository** (bouton vert)
3. Nom : `kingdom-events`
4. Laisse "Public" sélectionné
5. Clique **Create repository**
6. Sur la page suivante, clique **uploading an existing file**
7. Glisse-dépose TOUS les fichiers et dossiers de ce projet (sauf `node_modules` si présent)
8. Clique **Commit changes**

### B. Connecter Vercel à GitHub

1. Va sur [vercel.com](https://vercel.com)
2. Clique **Sign Up** → choisis **Continue with GitHub**
3. Une fois connecté, clique **Add New** → **Project**
4. Trouve ton dépôt `kingdom-events` dans la liste et clique **Import**
5. Vercel détecte automatiquement que c'est un projet Vite — ne change rien
6. Clique **Deploy**
7. Attends 1-2 minutes — ton site est en ligne avec une URL du type `kingdom-events.vercel.app`

---

## ÉTAPE 5 — Vérifier que tout fonctionne

1. Ouvre ton URL Vercel
2. Clique "Organisateurs" → "Créer un compte" → inscris une église test
3. Connecte-toi → publie un événement test avec une photo
4. Va sur "Admin" → connecte-toi avec ton compte admin
5. Tu devrais voir l'événement test apparaître → clique "Voir" pour voir la photo → clique "Approuver"
6. Retourne sur la page d'accueil → l'événement doit maintenant apparaître publiquement

---

## En cas de problème

**"Email not confirmed" en se connectant** → Tu n'as pas fait l'étape 3, ou l'email de confirmation n'a pas été cliqué. Va dans Supabase → Authentication → Users, trouve l'utilisateur, et confirme-le manuellement en cliquant sur les trois points → "Confirm email".

**Les photos ne s'uploadent pas** → Vérifie l'étape 1, en particulier le nom exact du bucket (`evenements-medias`) et les policies.

**"Failed to fetch" partout** → Vérifie que les clés dans `src/lib/supabase.js` correspondent bien à ton projet Supabase.

---

## Structure du projet (pour référence)

```
kingdom-events/
├── index.html              → page HTML racine
├── package.json            → liste des dépendances
├── vite.config.js          → configuration du build
└── src/
    ├── main.jsx             → point d'entrée React
    ├── App.jsx               → toute l'interface (pages, composants)
    └── lib/
        ├── supabase.js        → connexion à ta base
        ├── auth.js            → inscription, connexion, mot de passe oublié
        ├── evenements.js       → créer/lire/approuver les événements
        └── storage.js           → upload réel des photos et vidéos
```
