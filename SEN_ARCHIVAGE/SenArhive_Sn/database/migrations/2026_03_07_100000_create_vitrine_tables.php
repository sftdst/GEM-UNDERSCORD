<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Témoignages ──────────────────────────────────────────────────────
        Schema::create('vitrine_temoignages', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('role');
            $table->string('entreprise');
            $table->string('initiales', 5)->default('');       // ex: "AD"
            $table->string('photo_url')->nullable();            // URL photo optionnelle
            $table->text('contenu');
            $table->unsignedTinyInteger('note')->default(5);    // 1-5 étoiles
            $table->unsignedSmallInteger('ordre')->default(0);
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });

        // ── Partenaires ──────────────────────────────────────────────────────
        Schema::create('vitrine_partenaires', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('logo_url')->nullable();
            $table->string('site_web')->nullable();
            $table->string('description')->nullable();
            $table->unsignedSmallInteger('ordre')->default(0);
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });

        // ── Fonctionnalités vitrine (contenu dynamique landing) ──────────────
        Schema::create('vitrine_fonctionnalites', function (Blueprint $table) {
            $table->id();
            $table->string('icone', 50);                        // nom lucide-react ex: "Archive"
            $table->string('titre');
            $table->text('description');
            $table->string('couleur_bg')->default('oklch(0.65 0.19 45 / 0.10)');
            $table->string('couleur_icone')->default('oklch(0.65 0.19 45)');
            $table->unsignedSmallInteger('ordre')->default(0);
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });

        // ── Médias (vidéos tutos + captures d'écran) ─────────────────────────
        Schema::create('vitrine_medias', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['video', 'screenshot']);
            $table->string('titre');
            $table->text('description')->nullable();
            $table->string('url');                              // YouTube embed ou chemin fichier
            $table->string('thumbnail_url')->nullable();        // miniature vidéo ou image
            $table->string('section')->nullable();              // ex: "archivage", "workflow", "ocr"
            $table->unsignedSmallInteger('duree_secondes')->nullable(); // pour les vidéos
            $table->unsignedSmallInteger('ordre')->default(0);
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vitrine_medias');
        Schema::dropIfExists('vitrine_fonctionnalites');
        Schema::dropIfExists('vitrine_partenaires');
        Schema::dropIfExists('vitrine_temoignages');
    }
};
