<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gmp_soumissions_pieces', function (Blueprint $table) {
            $table->foreignUuid('piece_requise_id')->nullable()->change();
            $table->string('libelle_libre', 255)->nullable()->after('piece_requise_id');
        });
    }

    public function down(): void
    {
        Schema::table('gmp_soumissions_pieces', function (Blueprint $table) {
            $table->dropColumn('libelle_libre');
            $table->foreignUuid('piece_requise_id')->nullable(false)->change();
        });
    }
};
