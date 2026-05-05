export type User = {
    id: string;
    nom: string;
    prenom: string;
    name: string;
    email: string;
    avatar?: string;
    avatar_url?: string | null;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    organisation_id: string;
    role_id: string | null;
    statut: string;
    langue: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type SharedOrganisation = {
    id: string;
    nom: string;
    slug: string;
    logo_url: string | null;
    plan_id: string;
    statut: string;
    stockage_utilise_mo: number;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
