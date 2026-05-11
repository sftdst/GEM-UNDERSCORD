<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_marches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('marche_prevu_id')->nullable()->constrained('gmp_marches_prevus')->nullOnDelete();
            $table->foreignUuid('attribution_id')->nullable()->constrained('gmp_attributions')->nullOnDelete();
            $table->string('numero_reference', 100)->unique();
            $table->string('objet', 500);
            $table->foreignUuid('type_marche_id')->constrained('gmp_types_marche');
            $table->foreignUuid('mode_passation_id')->constrained('gmp_modes_passation');
            $table->foreignUuid('source_financement_id')->constrained('gmp_sources_financement');
            $table->foreignUuid('secteur_id')->constrained('gmp_secteurs_intervention');
            $table->foreignUuid('fournisseur_id')->constrained('gmp_fournisseurs');
            $table->foreignUuid('responsable_id')->constrained('utilisateurs');
            $table->decimal('montant_initial', 18, 2);
            $table->decimal('montant_actuel', 18, 2);
            $table->decimal('montant_paye', 18, 2)->default(0);
            $table->decimal('taux_avancement_physique', 5, 2)->default(0);
            $table->decimal('taux_avancement_financier', 5, 2)->default(0);
            $table->date('date_debut_prevue');
            $table->date('date_fin_prevue');
            $table->date('date_debut_reelle')->nullable();
            $table->date('date_fin_reelle')->nullable();
            $table->date('date_fin_projetee_ia')->nullable();
            $table->enum('statut', ['en_preparation', 'actif', 'suspendu', 'resilie', 'solde', 'cloture'])->default('en_preparation');
            $table->enum('statut_risque', ['vert', 'orange', 'rouge'])->default('vert');
            $table->decimal('score_risque', 4, 2)->nullable();
            $table->foreignUuid('dossier_id')->nullable()->constrained('dossiers')->nullOnDelete();
            $table->foreignUuid('created_by')->constrained('utilisateurs');
            $table->timestampsTz();

            $table->index('organisation_id');
            $table->index('statut');
            $table->index('statut_risque');
            $table->index('fournisseur_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_marches');
    }
};
