export const StatutUtilisateur = {
    ACTIF: 'actif',
    INACTIF: 'inactif',
    SUSPENDU: 'suspendu',
} as const;

export const StatutDocument = {
    ACTIF: 'actif',
    ARCHIVE: 'archive',
    SUPPRIME: 'supprime',
} as const;

export const StatutWorkflow = {
    BROUILLON: 'brouillon',
    ACTIF: 'actif',
    INACTIF: 'inactif',
} as const;

export const StatutInstanceWorkflow = {
    EN_COURS: 'en_cours',
    APPROUVE: 'approuve',
    REJETE: 'rejete',
    ANNULE: 'annule',
} as const;

export const StatutEtapeWorkflow = {
    EN_ATTENTE: 'en_attente',
    APPROUVE: 'approuve',
    REJETE: 'rejete',
} as const;

export const StatutAbonnement = {
    ACTIF: 'actif',
    ESSAI: 'essai',
    EXPIRE: 'expire',
    ANNULE: 'annule',
} as const;

export const StatutFacture = {
    BROUILLON: 'brouillon',
    EN_ATTENTE: 'en_attente',
    PAYEE: 'payee',
    ECHOUEE: 'echouee',
} as const;

export const MethodePaiement = {
    WAVE: 'wave',
    ORANGE_MONEY: 'orange_money',
    CARTE: 'carte',
    VIREMENT: 'virement',
} as const;

export const StatutPaiement = {
    EN_ATTENTE: 'en_attente',
    REUSSI: 'reussi',
    ECHOUE: 'echoue',
    REMBOURSE: 'rembourse',
} as const;

export const PrioriteTicket = {
    BASSE: 'basse',
    NORMALE: 'normale',
    HAUTE: 'haute',
    URGENTE: 'urgente',
} as const;

export const StatutTicket = {
    OUVERT: 'ouvert',
    EN_COURS: 'en_cours',
    RESOLU: 'resolu',
    FERME: 'ferme',
} as const;

export const Periodicite = {
    MENSUEL: 'mensuel',
    ANNUEL: 'annuel',
} as const;

export const StatutOrganisation = {
    ACTIVE: 'active',
    SUSPENDUE: 'suspendue',
    RESILIEE: 'resiliee',
} as const;
