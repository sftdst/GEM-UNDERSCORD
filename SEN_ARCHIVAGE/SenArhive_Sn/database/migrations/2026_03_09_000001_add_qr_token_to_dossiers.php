<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dossiers', function (Blueprint $table) {
            $table->string('qr_token', 64)->nullable()->unique()->after('icone');
        });

        // Générer un token pour les dossiers existants
        DB::table('dossiers')->whereNull('qr_token')->orderBy('id')->each(function ($dossier) {
            DB::table('dossiers')
                ->where('id', $dossier->id)
                ->update(['qr_token' => Str::random(32)]);
        });
    }

    public function down(): void
    {
        Schema::table('dossiers', function (Blueprint $table) {
            $table->dropColumn('qr_token');
        });
    }
};
