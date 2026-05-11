<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_pv_ouverture_plis', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('appel_offre_id')->constrained('gmp_appels_offres')->cascadeOnDelete();
            $table->timestampTz('date_ouverture');
            $table->string('lieu', 255);
            $table->foreignUuid('president_commission_id')->constrained('utilisateurs');
            $table->jsonb('membres_json')->default('[]');
            $table->jsonb('soumissions_json')->default('[]');
            $table->text('observations')->nullable();
            $table->string('pdf_path', 500)->nullable();
            $table->boolean('signe')->default(false);
            $table->timestampTz('created_at')->useCurrent();

            $table->index('appel_offre_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_pv_ouverture_plis');
    }
};
