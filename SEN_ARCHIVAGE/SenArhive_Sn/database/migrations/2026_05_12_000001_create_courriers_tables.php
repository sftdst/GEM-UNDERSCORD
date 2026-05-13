<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Table des types de courriers
        Schema::create('courrier_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nom', 100);
            $table->string('code', 50)->unique();
            $table->string('couleur', 7)->nullable();
            $table->string('icone', 50)->nullable();
            $table->boolean('actif')->default(true);
            $table->timestampsTz();
        });

        // Table des statuts de courriers
        Schema::create('courrier_statuts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nom', 100);
            $table->string('code', 50)->unique();
            $table->string('couleur', 7)->nullable();
            $table->integer('ordre')->default(0);
            $table->boolean('actif')->default(true);
            $table->timestampsTz();
        });

        // Table principale des courriers
        Schema::create('courriers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('numero', 50)->unique();
            $table->string('type', 20); // ENTRANT, SORTANT
            $table->string('objet', 500);
            $table->string('reference', 100)->nullable();

            // Expéditeur (courrier entrant)
            $table->string('expediteur_nom', 255)->nullable();
            $table->string('expediteur_organisation', 255)->nullable();
            $table->string('expediteur_adresse', 500)->nullable();
            $table->string('expediteur_email', 255)->nullable();
            $table->string('expediteur_telephone', 50)->nullable();

            // Destinataire (courrier sortant)
            $table->string('destinataire_nom', 255)->nullable();
            $table->string('destinataire_organisation', 255)->nullable();
            $table->string('destinataire_adresse', 500)->nullable();
            $table->string('destinataire_email', 255)->nullable();

            $table->foreignUuid('service_id')->nullable()->constrained('services')->nullOnDelete();
            $table->foreignUuid('agent_affecte_id')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->foreignUuid('courrier_type_id')->nullable()->constrained('courrier_types')->nullOnDelete();
            $table->foreignUuid('courrier_statut_id')->nullable()->constrained('courrier_statuts')->nullOnDelete();

            $table->string('categorie', 50)->nullable(); // Ordinaire, Confidentiel, Facture, Juridique, RH, Autre
            $table->string('urgence', 20)->default('Normal'); // Normal, Urgent, TresUrgent
            $table->string('moyen_envoi', 50)->nullable(); // Courrier postal, Email, Fax, Porteur
            $table->string('statut', 50)->default('RECU'); // RECU, AFFECTE, EN_COURS, TRAITE, CLOTURE

            $table->dateTime('date_reception')->nullable();
            $table->dateTime('date_envoi')->nullable();
            $table->date('date_echeance')->nullable();
            $table->date('date_traitement')->nullable();

            $table->text('observations')->nullable();
            $table->text('contenu_texte')->nullable(); // Texte extrait (OCR)

            $table->foreignUuid('created_by')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->foreignUuid('parent_courrier_id')->nullable()->constrained('courriers')->nullOnDelete();

            $table->string('hash_sha256', 64)->nullable();
            $table->integer('version_courante')->default(1);
            $table->boolean('accuse_reception_genere')->default(false);

            $table->index('numero');
            $table->index(['type', 'statut']);
            $table->index('date_reception');
            $table->index('courrier_statut_id');
            $table->index('agent_affecte_id');
            $table->index('created_by');
            $table->timestampsTz();
            $table->softDeletes();
        });

        // Détails des actions/transitions sur les courriers
        Schema::create('courrier_historiques', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('courrier_id')->constrained('courriers')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('utilisateurs')->nullOnDelete();
            $table->string('action', 100); // creation, affectation, transfert, statut_change, commentaire, etc.
            $table->string('ancien_statut', 100)->nullable();
            $table->string('nouveau_statut', 100)->nullable();
            $table->string('destinataire_transfert', 255)->nullable(); // nom de l'agent/dept destinataire
            $table->text('motif')->nullable();
            $table->text('details')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestampsTz();
        });

        // Commentaires internes sur les courriers
        Schema::create('courrier_commentaires', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('courrier_id')->constrained('courriers')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('utilisateurs')->nullOnDelete();
            $table->text('contenu');
            $table->boolean('interne')->default(true);
            $table->timestampsTz();
        });

        // Pièces jointes des courriers
        Schema::create('courrier_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('courrier_id')->constrained('courriers')->cascadeOnDelete();
            $table->string('nom_fichier', 500);
            $table->string('nom_fichier_original', 500);
            $table->string('chemin', 500);
            $table->string('mime_type', 100)->nullable();
            $table->integer('taille_octets')->default(0);
            $table->string('hash_sha256', 64)->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->timestampsTz();
        });

        // Liens entre courriers et dossiers thématiques
        Schema::create('courrier_dossier', function (Blueprint $table) {
            $table->uuid('courrier_id');
            $table->uuid('dossier_id');
            $table->primary(['courrier_id', 'dossier_id']);
            $table->timestampsTz();
        });

        // Modèles de lettres
        Schema::create('courrier_modeles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nom', 200);
            $table->string('type_modele', 50); // lettre_admin, note_service, bordereau, accuse_reception
            $table->text('contenu_html');
            $table->foreignUuid('created_by')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->timestampsTz();
        });

        // Notifications de courriers
        Schema::create('courrier_notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('utilisateurs')->cascadeOnDelete();
            $table->foreignUuid('courrier_id')->nullable()->constrained('courriers')->nullOnDelete();
            $table->string('type', 100); // affectation, rappel, escalation, cloture, nouveau
            $table->string('titre', 300);
            $table->text('message')->nullable();
            $table->string('lien', 300)->nullable();
            $table->boolean('lu')->default(false);
            $table->timestamp('lu_le')->nullable();
            $table->timestampsTz();
        });

        // Configuration du module courriers
        Schema::create('courrier_configurations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('cle', 100)->unique();
            $table->text('valeur')->nullable();
            $table->string('description', 500)->nullable();
            $table->timestampsTz();
        });

        // Alertes et rappels
        Schema::create('courrier_alerts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('courrier_id')->constrained('courriers')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('utilisateurs')->cascadeOnDelete();
            $table->string('type', 50); // rappel, escalation, retard
            $table->dateTime('date_alerte');
            $table->boolean('envoyee')->default(false);
            $table->boolean('lue')->default(false);
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courrier_alerts');
        Schema::dropIfExists('courrier_configurations');
        Schema::dropIfExists('courrier_notifications');
        Schema::dropIfExists('courrier_modeles');
        Schema::dropIfExists('courrier_dossier');
        Schema::dropIfExists('courrier_documents');
        Schema::dropIfExists('courrier_commentaires');
        Schema::dropIfExists('courrier_historiques');
        Schema::dropIfExists('courriers');
        Schema::dropIfExists('courrier_statuts');
        Schema::dropIfExists('courrier_types');
    }
};