<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('liens_partage', function (Blueprint $table) {
            // 'public' = anyone with the link, 'restreint' = only listed users
            $table->string('type_acces', 20)->default('public')->after('peut_telecharger');
        });

        Schema::create('partage_acces_utilisateurs', function (Blueprint $table) {
            $table->foreignUuid('lien_partage_id')->constrained('liens_partage')->cascadeOnDelete();
            $table->foreignUuid('utilisateur_id')->constrained('utilisateurs')->cascadeOnDelete();
            $table->primary(['lien_partage_id', 'utilisateur_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partage_acces_utilisateurs');
        Schema::table('liens_partage', function (Blueprint $table) {
            $table->dropColumn('type_acces');
        });
    }
};
