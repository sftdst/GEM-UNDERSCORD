<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Pipelines (templates de workflow avancé)
        Schema::create('pipelines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('nom', 255);
            $table->text('description')->nullable();
            $table->string('type_document', 100)->nullable(); // type de doc ciblé
            $table->enum('statut', ['actif', 'inactif'])->default('actif');
            $table->foreignUuid('created_by')->constrained('utilisateurs');
            $table->timestampsTz();
        });

        // 2. Étapes du pipeline (template)
        Schema::create('pipeline_etapes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pipeline_id')->constrained('pipelines')->cascadeOnDelete();
            $table->integer('ordre');
            $table->string('nom', 255);
            $table->text('description')->nullable();
            $table->enum('type_acteur', ['utilisateur', 'service', 'role']);
            $table->uuid('acteur_id')->nullable(); // id de l'utilisateur/service/role
            $table->boolean('annotation_obligatoire')->default(false);
            $table->boolean('fichier_requis')->default(false);
            $table->boolean('commentaire_requis')->default(false);
            $table->boolean('signature_requise')->default(false);
            // En cas de rejet : null = retour étape précédente, sinon ID de l'étape cible
            $table->uuid('rejet_etape_retour_id')->nullable();
            $table->timestampsTz();
        });

        // Contrainte auto-référentielle après création
        Schema::table('pipeline_etapes', function (Blueprint $table) {
            $table->foreign('rejet_etape_retour_id')
                ->references('id')->on('pipeline_etapes')
                ->nullOnDelete();
        });

        // 3. Instances pipeline (un document dans un pipeline)
        Schema::create('pipeline_instances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pipeline_id')->constrained('pipelines');
            $table->foreignUuid('document_id')->constrained('documents')->cascadeOnDelete();
            $table->enum('statut', ['en_attente', 'en_cours', 'complete', 'rejete', 'suspendu'])->default('en_attente');
            $table->uuid('etape_courante_id')->nullable(); // FK vers pipeline_etape_instances (ajouté après)
            $table->foreignUuid('initie_par')->constrained('utilisateurs');
            $table->text('commentaire_init')->nullable();
            $table->timestampsTz();
        });

        // 4. Instances d'étapes (exécution d'une étape pour une instance)
        Schema::create('pipeline_etape_instances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('instance_id')->constrained('pipeline_instances')->cascadeOnDelete();
            $table->foreignUuid('etape_id')->constrained('pipeline_etapes');
            $table->integer('ordre');
            $table->enum('statut', ['en_attente', 'en_cours', 'complete', 'valide', 'rejete', 'retour_modification'])->default('en_attente');
            $table->uuid('traite_par')->nullable();
            $table->foreign('traite_par')->references('id')->on('utilisateurs')->nullOnDelete();
            $table->text('commentaire')->nullable();
            $table->text('motif_rejet')->nullable();
            $table->timestampTz('traite_le')->nullable();
            $table->timestampTz('created_at')->useCurrent();
        });

        // Contrainte FK différée pour etape_courante_id
        Schema::table('pipeline_instances', function (Blueprint $table) {
            $table->foreign('etape_courante_id')
                ->references('id')->on('pipeline_etape_instances')
                ->nullOnDelete();
        });

        // 5. Historique immuable (pas d'updated_at)
        Schema::create('pipeline_historique', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('instance_id')->constrained('pipeline_instances')->cascadeOnDelete();
            $table->uuid('etape_instance_id')->nullable();
            $table->foreign('etape_instance_id')->references('id')->on('pipeline_etape_instances')->nullOnDelete();
            $table->uuid('utilisateur_id')->nullable();
            $table->foreign('utilisateur_id')->references('id')->on('utilisateurs')->nullOnDelete();
            $table->string('action', 100); // 'initiation','validation','rejet','annotation','transition','completion','demande_correction'
            $table->string('ancien_statut', 50)->nullable();
            $table->string('nouveau_statut', 50)->nullable();
            $table->text('commentaire')->nullable();
            $table->jsonb('donnees_supplementaires')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            // Pas de updated_at : immuable
        });

        // 6. Annotations par étape
        Schema::create('pipeline_annotations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('etape_instance_id')->constrained('pipeline_etape_instances')->cascadeOnDelete();
            $table->foreignUuid('utilisateur_id')->constrained('utilisateurs');
            $table->text('texte');
            $table->string('fichier_joint', 500)->nullable();
            $table->string('nom_fichier_original', 255)->nullable();
            $table->timestampTz('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pipeline_annotations');
        Schema::dropIfExists('pipeline_historique');
        Schema::table('pipeline_instances', fn (Blueprint $t) => $t->dropForeign(['etape_courante_id']));
        Schema::dropIfExists('pipeline_etape_instances');
        Schema::dropIfExists('pipeline_instances');
        Schema::table('pipeline_etapes', fn (Blueprint $t) => $t->dropForeign(['rejet_etape_retour_id']));
        Schema::dropIfExists('pipeline_etapes');
        Schema::dropIfExists('pipelines');
    }
};
