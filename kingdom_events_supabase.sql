-- ============================================================
--  KINGDOM EVENTS CAMEROUN — Base de données SUPABASE
--  Compatible PostgreSQL 13+ — à coller dans le SQL Editor Supabase
-- ============================================================
-- NOTE IMPORTANTE : Supabase gère déjà les mots de passe et la
-- récupération de mot de passe oublié via sa propre table "auth.users".
-- On NE recrée PAS cette logique — on s'y connecte simplement.
-- La table "profils" ci-dessous complète auth.users avec nos infos.
-- ============================================================

-- TABLE 1 : Profils utilisateurs (lié à l'auth Supabase)
CREATE TABLE profils (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom            VARCHAR(100),
  prenom         VARCHAR(100),
  telephone      VARCHAR(20),
  role           VARCHAR(20) NOT NULL DEFAULT 'visiteur' CHECK (role IN ('visiteur','organisateur','admin')),
  photo_profil   VARCHAR(500),
  ville          VARCHAR(100),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE 2 : Profils organisateurs (églises / ministères)
CREATE TABLE organisateurs (
  id             SERIAL PRIMARY KEY,
  profil_id      UUID NOT NULL UNIQUE REFERENCES profils(id) ON DELETE CASCADE,
  nom_eglise     VARCHAR(200) NOT NULL,
  denomination   VARCHAR(100),
  description    TEXT,
  logo_url       VARCHAR(500),
  site_web       VARCHAR(300),
  facebook       VARCHAR(300),
  youtube        VARCHAR(300),
  ville          VARCHAR(100) NOT NULL,
  quartier       VARCHAR(100),
  telephone      VARCHAR(20),
  statut         VARCHAR(20) NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente','approuve','rejete')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE 3 : Événements
CREATE TABLE evenements (
  id                SERIAL PRIMARY KEY,
  organisateur_id   INT NOT NULL REFERENCES organisateurs(id) ON DELETE CASCADE,
  titre             VARCHAR(300) NOT NULL,
  type              VARCHAR(100) NOT NULL,
  description       TEXT,
  lieu              VARCHAR(300) NOT NULL,
  adresse           VARCHAR(400),
  ville             VARCHAR(100) NOT NULL,
  latitude          DECIMAL(10,8),
  longitude         DECIMAL(11,8),
  date_debut        DATE NOT NULL,
  date_fin          DATE,
  heure_debut       TIME,
  heure_fin         TIME,
  prix              DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  capacite_max      INT,
  places_restantes  INT,
  statut            VARCHAR(20) NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente','approuve','rejete','annule')),
  est_gratuit       BOOLEAN NOT NULL DEFAULT true,
  est_en_ligne      BOOLEAN NOT NULL DEFAULT false,
  lien_streaming    VARCHAR(500),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  approuve_at       TIMESTAMPTZ
);
CREATE INDEX idx_evenements_ville ON evenements(ville);
CREATE INDEX idx_evenements_statut ON evenements(statut);
CREATE INDEX idx_evenements_date ON evenements(date_debut);

-- TABLE 4 : Médias (photos et vidéos)
CREATE TABLE medias (
  id              SERIAL PRIMARY KEY,
  evenement_id    INT NOT NULL REFERENCES evenements(id) ON DELETE CASCADE,
  type            VARCHAR(10) NOT NULL CHECK (type IN ('photo','video')),
  url             VARCHAR(500) NOT NULL,
  nom_fichier     VARCHAR(255),
  taille_mo       DECIMAL(6,2),
  est_couverture  BOOLEAN NOT NULL DEFAULT false,
  ordre           INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE 5 : Inscriptions / billets
CREATE TABLE inscriptions (
  id              SERIAL PRIMARY KEY,
  evenement_id    INT NOT NULL REFERENCES evenements(id) ON DELETE CASCADE,
  profil_id       UUID REFERENCES profils(id) ON DELETE SET NULL,
  nom             VARCHAR(100) NOT NULL,
  prenom          VARCHAR(100),
  email           VARCHAR(191),
  telephone       VARCHAR(20) NOT NULL,
  nombre_places   INT NOT NULL DEFAULT 1,
  montant_total   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  code_billet     VARCHAR(20) NOT NULL UNIQUE,
  statut          VARCHAR(20) NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente','confirme','annule')),
  present         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_inscriptions_code ON inscriptions(code_billet);

-- TABLE 6 : Paiements Mobile Money
CREATE TABLE paiements (
  id                  SERIAL PRIMARY KEY,
  inscription_id      INT NOT NULL REFERENCES inscriptions(id) ON DELETE CASCADE,
  operateur           VARCHAR(10) NOT NULL CHECK (operateur IN ('mtn','orange','autre')),
  numero_payeur       VARCHAR(20) NOT NULL,
  montant             DECIMAL(10,2) NOT NULL,
  reference_externe   VARCHAR(255),
  statut              VARCHAR(20) NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente','reussi','echoue','rembourse')),
  date_paiement       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE 7 : Annuaire des églises
CREATE TABLE eglises (
  id            SERIAL PRIMARY KEY,
  nom           VARCHAR(200) NOT NULL,
  denomination  VARCHAR(100),
  pasteur       VARCHAR(150),
  description   TEXT,
  logo_url      VARCHAR(500),
  adresse       VARCHAR(400),
  ville         VARCHAR(100) NOT NULL,
  quartier      VARCHAR(100),
  telephone     VARCHAR(20),
  email         VARCHAR(191),
  site_web      VARCHAR(300),
  facebook      VARCHAR(300),
  youtube       VARCHAR(300),
  latitude      DECIMAL(10,8),
  longitude     DECIMAL(11,8),
  est_verifie   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE 8 : Notifications
CREATE TABLE notifications (
  id          SERIAL PRIMARY KEY,
  profil_id   UUID NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  type        VARCHAR(100) NOT NULL,
  titre       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  canal       VARCHAR(20) NOT NULL DEFAULT 'email' CHECK (canal IN ('email','sms','push','whatsapp')),
  est_lu      BOOLEAN NOT NULL DEFAULT false,
  envoye_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  TRIGGER : crée automatiquement un profil à chaque inscription
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profils (id, nom, prenom)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'nom', NEW.raw_user_meta_data->>'prenom');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
--  SÉCURITÉ (Row Level Security) — protège les données
-- ============================================================
ALTER TABLE profils ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE evenements ENABLE ROW LEVEL SECURITY;
ALTER TABLE medias ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE eglises ENABLE ROW LEVEL SECURITY;

-- Chacun peut voir et modifier son propre profil
CREATE POLICY "Voir son profil" ON profils FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Modifier son profil" ON profils FOR UPDATE USING (auth.uid() = id);

-- Tout le monde peut voir les organisateurs approuvés
CREATE POLICY "Voir organisateurs" ON organisateurs FOR SELECT USING (true);
CREATE POLICY "Créer son organisation" ON organisateurs FOR INSERT WITH CHECK (auth.uid() = profil_id);
CREATE POLICY "Modifier son organisation" ON organisateurs FOR UPDATE USING (auth.uid() = profil_id);

-- Tout le monde voit les événements approuvés ; l'organisateur voit aussi les siens
CREATE POLICY "Voir événements approuvés" ON evenements FOR SELECT USING (
  statut = 'approuve' OR
  organisateur_id IN (SELECT id FROM organisateurs WHERE profil_id = auth.uid())
);
CREATE POLICY "Créer un événement" ON evenements FOR INSERT WITH CHECK (
  organisateur_id IN (SELECT id FROM organisateurs WHERE profil_id = auth.uid())
);
CREATE POLICY "Modifier son événement" ON evenements FOR UPDATE USING (
  organisateur_id IN (SELECT id FROM organisateurs WHERE profil_id = auth.uid())
);

-- Médias visibles si l'événement est visible
CREATE POLICY "Voir médias" ON medias FOR SELECT USING (true);
CREATE POLICY "Ajouter médias" ON medias FOR INSERT WITH CHECK (
  evenement_id IN (
    SELECT e.id FROM evenements e
    JOIN organisateurs o ON e.organisateur_id = o.id
    WHERE o.profil_id = auth.uid()
  )
);

-- Inscriptions : tout le monde peut s'inscrire (anonyme ou connecté)
CREATE POLICY "Créer une inscription" ON inscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Voir ses inscriptions" ON inscriptions FOR SELECT USING (
  profil_id = auth.uid() OR
  evenement_id IN (
    SELECT e.id FROM evenements e
    JOIN organisateurs o ON e.organisateur_id = o.id
    WHERE o.profil_id = auth.uid()
  )
);

-- Églises visibles par tous
CREATE POLICY "Voir églises" ON eglises FOR SELECT USING (true);

-- ============================================================
--  ADMINISTRATEURS : accès total (à faire manuellement)
-- ============================================================
-- Après avoir créé ton compte admin via l'inscription normale,
-- exécute cette ligne en remplaçant l'email par le tien :
--
-- UPDATE profils SET role = 'admin' WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'admin@kingdom.cm'
-- );

-- ============================================================
--  FIN DU SCRIPT
-- ============================================================
