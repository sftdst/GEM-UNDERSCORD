<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('notifications_custom')) {
            return;
        }

        Schema::create('notifications_custom', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('utilisateur_id')->constrained('utilisateurs')->cascadeOnDelete();
            $table->string('type', 50);
            $table->string('titre', 255);
            $table->text('message')->nullable();
            $table->string('lien', 500)->nullable();
            $table->foreignUuid('document_id')->nullable()->constrained('documents')->nullOnDelete();
            $table->boolean('lu')->default(false);
            $table->timestampTz('lu_le')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index('utilisateur_id');
            $table->index(['utilisateur_id', 'lu']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications_custom');
    }
};
