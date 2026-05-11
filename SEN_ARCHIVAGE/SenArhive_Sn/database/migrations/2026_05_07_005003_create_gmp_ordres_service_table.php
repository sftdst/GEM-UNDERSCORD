<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_ordres_service', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('marche_id')->constrained('gmp_marches')->cascadeOnDelete();
            $table->string('numero_os', 50);
            $table->enum('type', ['demarrage', 'suspension', 'reprise', 'prolongation', 'resiliation']);
            $table->date('date_emission');
            $table->date('date_prise_effet');
            $table->text('objet')->nullable();
            $table->jsonb('nouvelles_dates_json')->nullable();
            $table->foreignUuid('document_id')->nullable()->constrained('documents')->nullOnDelete();
            $table->boolean('notification_envoyee')->default(false);
            $table->foreignUuid('created_by')->constrained('utilisateurs');
            $table->timestampTz('created_at')->useCurrent();

            $table->unique(['marche_id', 'numero_os']);
            $table->index('marche_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_ordres_service');
    }
};
