-- ============================================================
-- SEN_ARCHIV - Plateforme GED SaaS
-- Schéma PostgreSQL complet
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Recherche full-text
CREATE EXTENSION IF NOT EXISTS "unaccent";        -- Recherche sans accents
CREATE EXTENSION IF NOT EXISTS "pgcrypto";        -- Chiffrement


-- ============================================================
-- 1. MODULE MULTI-TENANT (ORGANISATIONS)
-- ============================================================

CREATE TABLE plans (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom             VARCHAR(50) NOT NULL UNIQUE,  -- 'gratuit', 'standard', 'premium', 'entreprise'
    description     TEXT,
    prix_mensuel    NUMERIC(10,2) NOT NULL DEFAULT 0,
    prix_annuel     NUMERIC(10,2) NOT NULL DEFAULT 0,
    stockage_max_go INTEGER NOT NULL DEFAULT 5,   -- Go alloués
    users_max       INTEGER,                      -- NULL = illimité
    documents_max   INTEGER,                      -- NULL = illimité
    fonctionnalites JSONB DEFAULT '{}',           -- Flags des fonctionnalités activées
    actif           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE organisations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id             UUID NOT NULL REFERENCES plans(id),
    nom                 VARCHAR(255) NOT NULL,
    slug                VARCHAR(100) NOT NULL UNIQUE,   -- Identifiant URL
    logo_url            VARCHAR(500),
    domaine             VARCHAR(255),                   -- Ex: entreprise.com
    pays                VARCHAR(10) DEFAULT 'SN',
    langue_defaut       VARCHAR(10) DEFAULT 'fr',
    timezone            VARCHAR(50) DEFAULT 'Africa/Dakar',
    stockage_utilise_mo BIGINT NOT NULL DEFAULT 0,
    statut              VARCHAR(20) NOT NULL DEFAULT 'actif'
                        CHECK (statut IN ('actif','suspendu','resilie','essai')),
    date_essai_fin      DATE,
    parametres          JSONB DEFAULT '{}',            -- Config spécifique tenant
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organisations_slug ON organisations(slug);
CREATE INDEX idx_organisations_plan ON organisations(plan_id);


-- ============================================================
-- 2. MODULE UTILISATEURS & AUTHENTIFICATION
-- ============================================================

CREATE TABLE roles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    nom             VARCHAR(100) NOT NULL,
    description     TEXT,
    permissions     JSONB NOT NULL DEFAULT '{}',  -- Ex: {"doc_create":true, "doc_delete":false}
    est_systeme     BOOLEAN NOT NULL DEFAULT FALSE, -- Rôles non modifiables (admin, lecteur...)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organisation_id, nom)
);

CREATE TABLE utilisateurs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id     UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    role_id             UUID REFERENCES roles(id),
    email               VARCHAR(255) NOT NULL UNIQUE,
    nom                 VARCHAR(100) NOT NULL,
    prenom              VARCHAR(100) NOT NULL,
    telephone           VARCHAR(20),
    avatar_url          VARCHAR(500),
    langue              VARCHAR(10) DEFAULT 'fr',
    timezone            VARCHAR(50),
    mot_de_passe_hash   VARCHAR(255) NOT NULL,
    statut              VARCHAR(20) NOT NULL DEFAULT 'actif'
                        CHECK (statut IN ('actif','inactif','suspendu','invite')),
    email_verifie       BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_active          BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret          VARCHAR(255),              -- Secret TOTP chiffré
    derniere_connexion  TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_utilisateurs_organisation ON utilisateurs(organisation_id);
CREATE INDEX idx_utilisateurs_email ON utilisateurs(email);

CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id  UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL UNIQUE,
    ip_address      INET,
    user_agent      TEXT,
    expire_at       TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_user ON sessions(utilisateur_id);

CREATE TABLE tokens_reinitialisation (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id  UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL UNIQUE,
    type            VARCHAR(30) NOT NULL CHECK (type IN ('reset_password','email_verification','invitation')),
    expire_at       TIMESTAMPTZ NOT NULL,
    utilise         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE groupes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    nom             VARCHAR(100) NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organisation_id, nom)
);

CREATE TABLE groupes_utilisateurs (
    groupe_id       UUID NOT NULL REFERENCES groupes(id) ON DELETE CASCADE,
    utilisateur_id  UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    ajoute_le       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (groupe_id, utilisateur_id)
);


-- ============================================================
-- 3. MODULE GESTION DOCUMENTAIRE
-- ============================================================

CREATE TABLE espaces (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    nom             VARCHAR(255) NOT NULL,
    description     TEXT,
    couleur         VARCHAR(7),              -- Hex color #RRGGBB
    icone           VARCHAR(50),
    created_by      UUID NOT NULL REFERENCES utilisateurs(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dossiers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    espace_id       UUID REFERENCES espaces(id) ON DELETE SET NULL,
    parent_id       UUID REFERENCES dossiers(id) ON DELETE CASCADE,  -- Hiérarchie
    nom             VARCHAR(255) NOT NULL,
    description     TEXT,
    chemin          TEXT,                    -- Chemin matérialisé: /uuid1/uuid2/uuid3
    niveau          INTEGER NOT NULL DEFAULT 0,
    couleur         VARCHAR(7),
    icone           VARCHAR(50),
    created_by      UUID NOT NULL REFERENCES utilisateurs(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dossiers_organisation ON dossiers(organisation_id);
CREATE INDEX idx_dossiers_parent ON dossiers(parent_id);
CREATE INDEX idx_dossiers_chemin ON dossiers USING gist(chemin gist_trgm_ops);

CREATE TABLE tags (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    nom             VARCHAR(100) NOT NULL,
    couleur         VARCHAR(7),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organisation_id, nom)
);

CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    parent_id       UUID REFERENCES categories(id),
    nom             VARCHAR(100) NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organisation_id, nom)
);

CREATE TABLE documents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id     UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    dossier_id          UUID REFERENCES dossiers(id) ON DELETE SET NULL,
    categorie_id        UUID REFERENCES categories(id),
    titre               VARCHAR(500) NOT NULL,
    description         TEXT,
    nom_fichier_original VARCHAR(500) NOT NULL,
    extension           VARCHAR(20) NOT NULL,       -- pdf, docx, xlsx, jpg...
    type_mime           VARCHAR(100) NOT NULL,
    taille_octets       BIGINT NOT NULL DEFAULT 0,
    statut              VARCHAR(30) NOT NULL DEFAULT 'actif'
                        CHECK (statut IN ('actif','archive','supprime','en_attente')),
    version_courante    INTEGER NOT NULL DEFAULT 1,
    est_chiffre         BOOLEAN NOT NULL DEFAULT FALSE,
    hash_sha256         VARCHAR(64),               -- Intégrité fichier
    date_expiration     DATE,                      -- Pour alertes expiration
    metadonnees         JSONB DEFAULT '{}',        -- Champs personnalisables
    texte_extrait       TEXT,                      -- OCR / extraction texte
    vecteur_recherche   TSVECTOR,                  -- Full-text search
    created_by          UUID NOT NULL REFERENCES utilisateurs(id),
    updated_by          UUID REFERENCES utilisateurs(id),
    deleted_at          TIMESTAMPTZ,               -- Soft delete
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_organisation ON documents(organisation_id);
CREATE INDEX idx_documents_dossier ON documents(dossier_id);
CREATE INDEX idx_documents_statut ON documents(statut);
CREATE INDEX idx_documents_extension ON documents(extension);
CREATE INDEX idx_documents_expiration ON documents(date_expiration) WHERE date_expiration IS NOT NULL;
CREATE INDEX idx_documents_fts ON documents USING gin(vecteur_recherche);
CREATE INDEX idx_documents_metadonnees ON documents USING gin(metadonnees);

-- Trigger pour MAJ du vecteur de recherche
CREATE OR REPLACE FUNCTION update_document_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.vecteur_recherche :=
        setweight(to_tsvector('french', coalesce(NEW.titre, '')), 'A') ||
        setweight(to_tsvector('french', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('french', coalesce(NEW.texte_extrait, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_documents_search_vector
    BEFORE INSERT OR UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_document_search_vector();

-- Versions des documents
CREATE TABLE versions_documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    numero_version  INTEGER NOT NULL,
    nom_fichier     VARCHAR(500) NOT NULL,
    taille_octets   BIGINT NOT NULL,
    hash_sha256     VARCHAR(64),
    chemin_stockage VARCHAR(1000) NOT NULL,  -- Chemin S3 / object storage
    url_stockage    VARCHAR(1000),
    commentaire     TEXT,                    -- Commentaire de version
    created_by      UUID NOT NULL REFERENCES utilisateurs(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(document_id, numero_version)
);

-- Table de liaison Documents <-> Tags
CREATE TABLE documents_tags (
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tag_id      UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, tag_id)
);


-- ============================================================
-- 4. MODULE PERMISSIONS & PARTAGE
-- ============================================================

CREATE TABLE permissions_documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id     UUID REFERENCES documents(id) ON DELETE CASCADE,
    dossier_id      UUID REFERENCES dossiers(id) ON DELETE CASCADE,
    espace_id       UUID REFERENCES espaces(id) ON DELETE CASCADE,
    utilisateur_id  UUID REFERENCES utilisateurs(id) ON DELETE CASCADE,
    groupe_id       UUID REFERENCES groupes(id) ON DELETE CASCADE,
    peut_lire       BOOLEAN NOT NULL DEFAULT TRUE,
    peut_ecrire     BOOLEAN NOT NULL DEFAULT FALSE,
    peut_supprimer  BOOLEAN NOT NULL DEFAULT FALSE,
    peut_partager   BOOLEAN NOT NULL DEFAULT FALSE,
    peut_telecharger BOOLEAN NOT NULL DEFAULT TRUE,
    peut_commenter  BOOLEAN NOT NULL DEFAULT TRUE,
    expire_le       TIMESTAMPTZ,
    accorde_par     UUID NOT NULL REFERENCES utilisateurs(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Au moins un cible et une ressource doivent être définis
    CONSTRAINT chk_cible CHECK (utilisateur_id IS NOT NULL OR groupe_id IS NOT NULL),
    CONSTRAINT chk_ressource CHECK (
        document_id IS NOT NULL OR dossier_id IS NOT NULL OR espace_id IS NOT NULL
    )
);

CREATE INDEX idx_permissions_document ON permissions_documents(document_id);
CREATE INDEX idx_permissions_dossier ON permissions_documents(dossier_id);
CREATE INDEX idx_permissions_user ON permissions_documents(utilisateur_id);
CREATE INDEX idx_permissions_groupe ON permissions_documents(groupe_id);

-- Liens de partage externe (accès par lien public)
CREATE TABLE liens_partage (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    document_id     UUID REFERENCES documents(id) ON DELETE CASCADE,
    dossier_id      UUID REFERENCES dossiers(id) ON DELETE CASCADE,
    token           VARCHAR(100) NOT NULL UNIQUE,
    mot_de_passe    VARCHAR(255),              -- Optionnel, hash
    peut_telecharger BOOLEAN NOT NULL DEFAULT TRUE,
    expire_le       TIMESTAMPTZ,
    max_telechargements INTEGER,
    nb_telechargements  INTEGER NOT NULL DEFAULT 0,
    created_by      UUID NOT NULL REFERENCES utilisateurs(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 5. MODULE COLLABORATION
-- ============================================================

CREATE TABLE commentaires (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    parent_id       UUID REFERENCES commentaires(id) ON DELETE CASCADE, -- Réponses
    utilisateur_id  UUID NOT NULL REFERENCES utilisateurs(id),
    contenu         TEXT NOT NULL,
    position_json   JSONB,                     -- Position annotation dans le doc
    est_resolu      BOOLEAN NOT NULL DEFAULT FALSE,
    modifie_le      TIMESTAMPTZ,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commentaires_document ON commentaires(document_id);

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id  UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,  -- 'nouveau_doc','modification','commentaire','approbation','expiration'
    titre           VARCHAR(255) NOT NULL,
    message         TEXT,
    lien            VARCHAR(500),
    document_id     UUID REFERENCES documents(id) ON DELETE SET NULL,
    lu              BOOLEAN NOT NULL DEFAULT FALSE,
    lu_le           TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(utilisateur_id);
CREATE INDEX idx_notifications_non_lu ON notifications(utilisateur_id, lu) WHERE lu = FALSE;


-- ============================================================
-- 6. MODULE WORKFLOW (Validation / Approbation)
-- ============================================================

CREATE TABLE workflows (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    nom             VARCHAR(255) NOT NULL,
    description     TEXT,
    etapes          JSONB NOT NULL DEFAULT '[]', -- Définition des étapes
    actif           BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      UUID NOT NULL REFERENCES utilisateurs(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE instances_workflow (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id     UUID NOT NULL REFERENCES workflows(id),
    document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    statut          VARCHAR(30) NOT NULL DEFAULT 'en_cours'
                    CHECK (statut IN ('en_cours','approuve','rejete','annule')),
    etape_courante  INTEGER NOT NULL DEFAULT 1,
    initie_par      UUID NOT NULL REFERENCES utilisateurs(id),
    commentaire     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE etapes_workflow (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id         UUID NOT NULL REFERENCES instances_workflow(id) ON DELETE CASCADE,
    numero_etape        INTEGER NOT NULL,
    approbateur_id      UUID NOT NULL REFERENCES utilisateurs(id),
    statut              VARCHAR(20) NOT NULL DEFAULT 'en_attente'
                        CHECK (statut IN ('en_attente','approuve','rejete')),
    commentaire         TEXT,
    traite_le           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 7. MODULE AUDIT & SECURITE
-- ============================================================

CREATE TABLE journaux_activite (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    utilisateur_id  UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,       -- 'doc_upload','doc_download','doc_delete','login'...
    ressource_type  VARCHAR(50),                 -- 'document','dossier','utilisateur'...
    ressource_id    UUID,
    detail          JSONB DEFAULT '{}',          -- Données complémentaires
    ip_address      INET,
    user_agent      TEXT,
    statut          VARCHAR(10) DEFAULT 'succes' CHECK (statut IN ('succes','echec')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_organisation ON journaux_activite(organisation_id);
CREATE INDEX idx_audit_utilisateur ON journaux_activite(utilisateur_id);
CREATE INDEX idx_audit_action ON journaux_activite(action);
CREATE INDEX idx_audit_date ON journaux_activite(created_at DESC);
CREATE INDEX idx_audit_ressource ON journaux_activite(ressource_type, ressource_id);


-- ============================================================
-- 8. MODULE ABONNEMENTS & FACTURATION
-- ============================================================

CREATE TABLE abonnements (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id     UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    plan_id             UUID NOT NULL REFERENCES plans(id),
    statut              VARCHAR(20) NOT NULL DEFAULT 'actif'
                        CHECK (statut IN ('actif','expire','annule','en_attente','essai')),
    periodicite         VARCHAR(10) NOT NULL DEFAULT 'mensuel'
                        CHECK (periodicite IN ('mensuel','annuel')),
    date_debut          DATE NOT NULL DEFAULT CURRENT_DATE,
    date_fin            DATE,
    date_renouvellement DATE,
    prix_applique       NUMERIC(10,2) NOT NULL,
    devise              VARCHAR(3) NOT NULL DEFAULT 'XOF',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE factures (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    abonnement_id   UUID NOT NULL REFERENCES abonnements(id),
    numero          VARCHAR(50) NOT NULL UNIQUE,   -- Ex: INV-2025-00001
    montant_ht      NUMERIC(10,2) NOT NULL,
    taux_tva        NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    montant_tva     NUMERIC(10,2) NOT NULL,
    montant_ttc     NUMERIC(10,2) NOT NULL,
    devise          VARCHAR(3) NOT NULL DEFAULT 'XOF',
    statut          VARCHAR(20) NOT NULL DEFAULT 'en_attente'
                    CHECK (statut IN ('en_attente','payee','echouee','remboursee')),
    periode_debut   DATE NOT NULL,
    periode_fin     DATE NOT NULL,
    url_pdf         VARCHAR(500),
    paye_le         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE paiements (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facture_id          UUID NOT NULL REFERENCES factures(id),
    organisation_id     UUID NOT NULL REFERENCES organisations(id),
    montant             NUMERIC(10,2) NOT NULL,
    devise              VARCHAR(3) NOT NULL DEFAULT 'XOF',
    methode             VARCHAR(30) NOT NULL,   -- 'wave','orange_money','carte','virement'
    reference_externe   VARCHAR(255),           -- ID transaction passerelle
    statut              VARCHAR(20) NOT NULL DEFAULT 'en_attente'
                        CHECK (statut IN ('en_attente','reussi','echoue','rembourse')),
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 9. MODULE SUPPORT & TICKETS
-- ============================================================

CREATE TABLE tickets_support (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    utilisateur_id  UUID NOT NULL REFERENCES utilisateurs(id),
    sujet           VARCHAR(500) NOT NULL,
    description     TEXT NOT NULL,
    priorite        VARCHAR(10) NOT NULL DEFAULT 'normale'
                    CHECK (priorite IN ('basse','normale','haute','urgente')),
    statut          VARCHAR(20) NOT NULL DEFAULT 'ouvert'
                    CHECK (statut IN ('ouvert','en_cours','resolu','ferme')),
    agent_id        UUID REFERENCES utilisateurs(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE messages_ticket (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id       UUID NOT NULL REFERENCES tickets_support(id) ON DELETE CASCADE,
    utilisateur_id  UUID NOT NULL REFERENCES utilisateurs(id),
    message         TEXT NOT NULL,
    est_interne     BOOLEAN NOT NULL DEFAULT FALSE, -- Note interne agent
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 10. FONCTIONS UTILITAIRES
-- ============================================================

-- Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Application du trigger sur toutes les tables concernées
DO $$
DECLARE tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'organisations','utilisateurs','documents','dossiers','espaces',
        'abonnements','workflows','instances_workflow','tickets_support',
        'plans','roles'
    ] LOOP
        EXECUTE format('
            CREATE TRIGGER trg_%s_updated_at
            BEFORE UPDATE ON %s
            FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
            tbl, tbl);
    END LOOP;
END;
$$;


-- ============================================================
-- 11. DONNÉES D'INITIALISATION
-- ============================================================

-- Plans de base
INSERT INTO plans (nom, description, prix_mensuel, prix_annuel, stockage_max_go, users_max, documents_max, fonctionnalites) VALUES
('gratuit',    'Plan gratuit',    0,      0,      2,    3,   100,  '{"ocr":false,"workflow":false,"signature":false,"api":false}'),
('standard',   'Plan Standard',   9900,   99000,  20,   10,  NULL, '{"ocr":true,"workflow":false,"signature":false,"api":true}'),
('premium',    'Plan Premium',    29900,  299000, 100,  50,  NULL, '{"ocr":true,"workflow":true,"signature":true,"api":true}'),
('entreprise', 'Plan Entreprise', 79900,  799000, 500,  NULL, NULL, '{"ocr":true,"workflow":true,"signature":true,"api":true,"ia":true}');


-- ============================================================
-- FIN DU SCHÉMA SEN_ARCHIV
-- ============================================================
