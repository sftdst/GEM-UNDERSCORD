<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets_support', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('utilisateur_id')->constrained('utilisateurs');
            $table->string('sujet', 500);
            $table->text('description');
            $table->string('priorite', 10)->default('normale');
            $table->string('statut', 20)->default('ouvert');
            $table->foreignUuid('agent_id')->nullable()->constrained('utilisateurs');
            $table->timestampsTz();
        });

        Schema::create('messages_ticket', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('ticket_id')->constrained('tickets_support')->cascadeOnDelete();
            $table->foreignUuid('utilisateur_id')->constrained('utilisateurs');
            $table->text('message');
            $table->boolean('est_interne')->default(false);
            $table->timestampTz('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages_ticket');
        Schema::dropIfExists('tickets_support');
    }
};
