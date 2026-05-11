<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gmp_paiements_marche', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('marche_id')->constrained('gmp_marches')->cascadeOnDelete();
            $table->foreignUuid('bon_a_payer_id')->nullable()->constrained('gmp_bons_a_payer')->nullOnDelete();
            $table->decimal('montant', 18, 2);
            $table->date('date_paiement');
            $table->string('reference_paiement', 100);
            $table->string('mode_paiement', 50)->nullable();
            $table->decimal('cumul_paye', 18, 2);
            $table->foreignUuid('document_id')->nullable()->constrained('documents')->nullOnDelete();
            $table->timestampTz('created_at')->useCurrent();

            $table->index('marche_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gmp_paiements_marche');
    }
};
