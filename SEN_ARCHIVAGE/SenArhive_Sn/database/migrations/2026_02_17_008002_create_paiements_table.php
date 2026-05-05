<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('facture_id')->constrained('factures');
            $table->foreignUuid('organisation_id')->constrained('organisations');
            $table->decimal('montant', 10, 2);
            $table->string('devise', 3)->default('XOF');
            $table->string('methode', 30);
            $table->string('reference_externe', 255)->nullable();
            $table->string('statut', 20)->default('en_attente');
            $table->jsonb('metadata')->default('{}');
            $table->timestampTz('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};
