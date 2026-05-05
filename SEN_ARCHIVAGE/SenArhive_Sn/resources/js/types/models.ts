export interface Fonctionnalite {
    id: string;
    code: string;
    nom: string;
    description: string | null;
    categorie: string | null;
    ordre: number;
    actif: boolean;
}

export interface Plan {
    id: string;
    nom: string;
    description: string | null;
    prix_mensuel: number;
    prix_annuel: number;
    stockage_max_go: number;
    users_max: number | null;
    documents_max: number | null;
    avantages: Record<string, boolean>;
    actif: boolean;
    fonctionnalites?: Fonctionnalite[];
}

export interface Organisation {
    id: string;
    plan_id: string;
    nom: string;
    slug: string;
    logo_url: string | null;
    domaine: string | null;
    pays: string;
    langue_defaut: string;
    timezone: string;
    stockage_utilise_mo: number;
    statut: 'actif' | 'suspendu' | 'resilie' | 'essai';
    date_essai_fin: string | null;
    plan?: Plan;
}

export interface Role {
    id: string;
    organisation_id: string;
    nom: string;
    description: string | null;
    permissions: Record<string, boolean>;
    est_systeme: boolean;
}

export interface Departement {
    id: string;
    organisation_id: string;
    nom: string;
    description: string | null;
    code: string | null;
    responsable_id: string | null;
    actif: boolean;
    responsable?: Utilisateur;
    services?: Service[];
    services_count?: number;
    utilisateurs_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Service {
    id: string;
    organisation_id: string;
    departement_id: string;
    nom: string;
    description: string | null;
    code: string | null;
    responsable_id: string | null;
    actif: boolean;
    departement?: Departement;
    responsable?: Utilisateur;
    utilisateurs?: Utilisateur[];
    utilisateurs_count?: number;
    documents_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Utilisateur {
    id: string;
    organisation_id: string;
    role_id: string | null;
    service_id: string | null;
    email: string;
    nom: string;
    prenom: string;
    telephone: string | null;
    avatar_url: string | null;
    langue: string;
    timezone: string | null;
    statut: 'actif' | 'inactif' | 'suspendu' | 'invite';
    email_verifie: boolean;
    email_verified_at: string | null;
    mfa_active: boolean;
    two_factor_enabled?: boolean;
    derniere_connexion: string | null;
    nom_complet?: string;
    name?: string;
    role?: Role;
    service?: Service;
    organisation?: Organisation;
    created_at: string;
    updated_at: string;
}

export interface Groupe {
    id: string;
    organisation_id: string;
    nom: string;
    description: string | null;
    utilisateurs?: Utilisateur[];
    utilisateurs_count?: number;
}

export interface Espace {
    id: string;
    organisation_id: string;
    nom: string;
    description: string | null;
    couleur: string | null;
    icone: string | null;
    created_by: string;
    createur?: Utilisateur;
    dossiers?: Dossier[];
    dossiers_count?: number;
    documents_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Dossier {
    id: string;
    organisation_id: string;
    espace_id: string | null;
    parent_id: string | null;
    nom: string;
    description: string | null;
    chemin: string | null;
    niveau: number;
    couleur: string | null;
    icone: string | null;
    created_by: string;
    qr_token: string | null;
    espace?: Espace;
    parent?: Dossier;
    enfants?: Dossier[];
    documents?: Document[];
    createur?: Utilisateur;
    documents_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Tag {
    id: string;
    organisation_id: string;
    nom: string;
    couleur: string | null;
}

export interface Categorie {
    id: string;
    organisation_id: string;
    parent_id: string | null;
    nom: string;
    description: string | null;
    parent?: Categorie;
    enfants?: Categorie[];
}

export interface Document {
    id: string;
    organisation_id: string;
    dossier_id: string | null;
    categorie_id: string | null;
    titre: string;
    numero_document: string | null;
    date_document: string | null;
    description: string | null;
    nom_fichier_original: string;
    extension: string;
    type_mime: string;
    taille_octets: number;
    statut: 'actif' | 'archive' | 'supprime' | 'en_attente';
    version_courante: number;
    est_chiffre: boolean;
    hash_sha256: string | null;
    date_expiration: string | null;
    date_archivage: string | null;
    metadonnees: Record<string, unknown>;
    texte_extrait: string | null;
    created_by: string;
    updated_by: string | null;
    taille_formatee?: string;
    dossier?: Dossier;
    categorie?: Categorie;
    createur?: Utilisateur;
    modificateur?: Utilisateur;
    tags?: Tag[];
    versions?: VersionDocument[];
    commentaires?: Commentaire[];
    signatures?: DocumentSignature[];
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface DocumentSignature {
    id: string;
    document_id: string;
    utilisateur_id: string;
    signature_data: string | null;
    signature_algo: string;
    reference_externe: string | null;
    metadonnees: Record<string, unknown> | null;
    signed_at: string;
    ip_address: string | null;
    user_agent: string | null;
    utilisateur?: Utilisateur;
    created_at: string;
    updated_at: string;
}

export interface VersionDocument {
    id: string;
    document_id: string;
    numero_version: number;
    nom_fichier: string;
    taille_octets: number;
    hash_sha256: string | null;
    chemin_stockage: string;
    url_stockage: string | null;
    commentaire: string | null;
    created_by: string;
    createur?: Utilisateur;
    created_at: string;
}

export interface LienPartage {
    id: string;
    organisation_id: string;
    document_id: string | null;
    dossier_id: string | null;
    token: string;
    peut_telecharger: boolean;
    type_acces: 'public' | 'restreint';
    expire_le: string | null;
    max_telechargements: number | null;
    nb_telechargements: number;
    created_by: string;
    est_protege: boolean;
    created_at: string;
    document?: Document;
    dossier?: Dossier;
    utilisateurs_autorises?: Utilisateur[];
}

export interface Commentaire {
    id: string;
    document_id: string;
    parent_id: string | null;
    utilisateur_id: string;
    contenu: string;
    position_json: Record<string, unknown> | null;
    est_resolu: boolean;
    modifie_le: string | null;
    deleted_at: string | null;
    created_at: string;
    utilisateur?: Utilisateur;
    parent?: Commentaire;
    reponses?: Commentaire[];
}

export interface NotificationCustom {
    id: string;
    utilisateur_id: string;
    type: string;
    titre: string;
    message: string | null;
    lien: string | null;
    document_id: string | null;
    lu: boolean;
    lu_le: string | null;
    created_at: string;
    document?: Document;
}

export interface Workflow {
    id: string;
    organisation_id: string;
    nom: string;
    description: string | null;
    etapes: WorkflowEtapeTemplate[];
    actif: boolean;
    created_by: string;
    createur?: Utilisateur;
    instances?: InstanceWorkflow[];
    created_at: string;
    updated_at: string;
}

export interface WorkflowEtapeTemplate {
    nom: string;
    approbateur_id: string;
    approbateur_nom?: string;
}

export interface InstanceWorkflow {
    id: string;
    workflow_id: string;
    document_id: string;
    statut: 'en_cours' | 'approuve' | 'rejete' | 'annule';
    etape_courante: number;
    initie_par: string;
    commentaire: string | null;
    workflow?: Workflow;
    document?: Document;
    initiateur?: Utilisateur;
    etapes?: EtapeWorkflow[];
    created_at: string;
    updated_at: string;
}

export interface EtapeWorkflow {
    id: string;
    instance_id: string;
    numero_etape: number;
    approbateur_id: string;
    statut: 'en_attente' | 'approuve' | 'rejete';
    commentaire: string | null;
    traite_le: string | null;
    created_at: string;
    approbateur?: Utilisateur;
}

export interface JournalActivite {
    id: string;
    organisation_id: string;
    utilisateur_id: string | null;
    action: string;
    ressource_type: string | null;
    ressource_id: string | null;
    detail: Record<string, unknown>;
    ip_address: string | null;
    user_agent: string | null;
    statut: 'succes' | 'echec';
    created_at: string;
    utilisateur?: Utilisateur;
}

export interface Abonnement {
    id: string;
    organisation_id: string;
    plan_id: string;
    statut: 'actif' | 'expire' | 'annule' | 'en_attente' | 'essai';
    periodicite: 'mensuel' | 'annuel';
    date_debut: string;
    date_fin: string | null;
    date_renouvellement: string | null;
    prix_applique: number;
    devise: string;
    plan?: Plan;
    created_at: string;
    updated_at: string;
}

export interface Facture {
    id: string;
    organisation_id: string;
    abonnement_id: string;
    numero: string;
    montant_ht: number;
    taux_tva: number;
    montant_tva: number;
    montant_ttc: number;
    devise: string;
    statut: 'en_attente' | 'payee' | 'echouee' | 'remboursee';
    periode_debut: string;
    periode_fin: string;
    url_pdf: string | null;
    paye_le: string | null;
    created_at: string;
    paiements?: Paiement[];
}

export interface Paiement {
    id: string;
    facture_id: string;
    organisation_id: string;
    montant: number;
    devise: string;
    methode: 'wave' | 'orange_money' | 'carte' | 'virement';
    reference_externe: string | null;
    statut: 'en_attente' | 'reussi' | 'echoue' | 'rembourse';
    metadata: Record<string, unknown>;
    created_at: string;
}

export interface TicketSupport {
    id: string;
    organisation_id: string;
    utilisateur_id: string;
    sujet: string;
    description: string;
    priorite: 'basse' | 'normale' | 'haute' | 'urgente';
    statut: 'ouvert' | 'en_cours' | 'resolu' | 'ferme';
    agent_id: string | null;
    utilisateur?: Utilisateur;
    agent?: Utilisateur;
    messages?: MessageTicket[];
    created_at: string;
    updated_at: string;
}

export interface MessageTicket {
    id: string;
    ticket_id: string;
    utilisateur_id: string;
    message: string;
    est_interne: boolean;
    created_at: string;
    utilisateur?: Utilisateur;
}

// ─── Module Pipeline GED ────────────────────────────────────────────────────

export interface Pipeline {
    id: string;
    organisation_id: string;
    nom: string;
    description: string | null;
    type_document: string | null;
    statut: 'actif' | 'inactif';
    created_by: string;
    createur?: Utilisateur;
    etapes?: PipelineEtape[];
    etapes_count?: number;
    instances?: PipelineInstance[];
    instances_count?: number;
    created_at: string;
    updated_at: string;
}

export interface PipelineEtape {
    id: string;
    pipeline_id: string;
    ordre: number;
    nom: string;
    description: string | null;
    type_acteur: 'utilisateur' | 'service' | 'role';
    acteur_id: string | null;
    acteur_nom: string; // appended: nom résolu de l'acteur
    annotation_obligatoire: boolean;
    fichier_requis: boolean;
    commentaire_requis: boolean;
    signature_requise: boolean;
    rejet_etape_retour_id: string | null;
    etape_rejet?: PipelineEtape;
    created_at: string;
    updated_at: string;
}

export interface PipelineInstance {
    id: string;
    pipeline_id: string;
    document_id: string;
    statut: 'en_attente' | 'en_cours' | 'complete' | 'rejete' | 'suspendu';
    etape_courante_id: string | null;
    initie_par: string;
    commentaire_init: string | null;
    pipeline?: Pipeline;
    document?: Document;
    initiateur?: Utilisateur;
    etape_courante?: PipelineEtapeInstance;
    etape_instances?: PipelineEtapeInstance[];
    historique?: PipelineHistorique[];
    created_at: string;
    updated_at: string;
}

export interface PipelineEtapeInstance {
    id: string;
    instance_id: string;
    etape_id: string;
    ordre: number;
    statut: 'en_attente' | 'en_cours' | 'complete' | 'valide' | 'rejete' | 'retour_modification';
    acteur_type_override: 'utilisateur' | 'service' | 'role' | null;
    acteur_id_override: string | null;
    // Appended: acteur effectif (override ou template)
    acteur_effectif_type: 'utilisateur' | 'service' | 'role';
    acteur_effectif_id: string | null;
    acteur_effectif_nom: string;
    traite_par: string | null;
    commentaire: string | null;
    motif_rejet: string | null;
    traite_le: string | null;
    created_at: string;
    etape?: PipelineEtape;
    traite_par_utilisateur?: Utilisateur;
    annotations?: PipelineAnnotation[];
    historique?: PipelineHistorique[];
}

export interface PipelineHistorique {
    id: string;
    instance_id: string;
    etape_instance_id: string | null;
    utilisateur_id: string | null;
    action: string;
    ancien_statut: string | null;
    nouveau_statut: string;
    commentaire: string | null;
    donnees_supplementaires: Record<string, unknown> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    utilisateur?: Utilisateur;
    etape_instance?: PipelineEtapeInstance;
}

export interface PipelineAnnotation {
    id: string;
    etape_instance_id: string;
    utilisateur_id: string;
    texte: string;
    fichier_joint: string | null;
    nom_fichier_original: string | null;
    created_at: string;
    utilisateur?: Utilisateur;
}

// ────────────────────────────────────────────────────────────────────────────

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}
