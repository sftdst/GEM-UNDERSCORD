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
        if (!Schema::hasTable('notifications_custom')) {
            return;
        }

        Schema::table('notifications_custom', function (Blueprint $table) {
            $table->foreignUuid('acteur_id')->nullable()->after('utilisateur_id')
                  ->constrained('utilisateurs')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('notifications_custom', function (Blueprint $table) {
            $table->dropForeign(['acteur_id']);
            $table->dropColumn('acteur_id');
        });
    }
};
