<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pipeline_etape_instances', function (Blueprint $table) {
            // Permet de réassigner une étape à un acteur différent au niveau de l'instance
            $table->enum('acteur_type_override', ['utilisateur', 'service', 'role'])
                ->nullable()
                ->after('statut');
            $table->uuid('acteur_id_override')
                ->nullable()
                ->after('acteur_type_override');
        });
    }

    public function down(): void
    {
        Schema::table('pipeline_etape_instances', function (Blueprint $table) {
            $table->dropColumn(['acteur_type_override', 'acteur_id_override']);
        });
    }
};
