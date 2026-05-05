<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('departements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('nom');
            $table->string('description')->nullable();
            $table->string('code', 20)->nullable();
            $table->uuid('responsable_id')->nullable();
            $table->foreign('responsable_id')->references('id')->on('utilisateurs')->nullOnDelete();
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });

        Schema::create('services', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignUuid('departement_id')->constrained('departements')->cascadeOnDelete();
            $table->string('nom');
            $table->string('description')->nullable();
            $table->string('code', 20)->nullable();
            $table->uuid('responsable_id')->nullable();
            $table->foreign('responsable_id')->references('id')->on('utilisateurs')->nullOnDelete();
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });

        // Add service_id to utilisateurs
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->uuid('service_id')->nullable()->after('role_id');
            $table->foreign('service_id')->references('id')->on('services')->nullOnDelete();
        });

        // Add service_id to documents for filtering
        Schema::table('documents', function (Blueprint $table) {
            $table->uuid('service_id')->nullable()->after('organisation_id');
            $table->foreign('service_id')->references('id')->on('services')->nullOnDelete();
        });

        // Add service_id to dossiers
        Schema::table('dossiers', function (Blueprint $table) {
            $table->uuid('service_id')->nullable()->after('organisation_id');
            $table->foreign('service_id')->references('id')->on('services')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('dossiers', function (Blueprint $table) {
            $table->dropForeign(['service_id']);
            $table->dropColumn('service_id');
        });
        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['service_id']);
            $table->dropColumn('service_id');
        });
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->dropForeign(['service_id']);
            $table->dropColumn('service_id');
        });
        Schema::dropIfExists('services');
        Schema::dropIfExists('departements');
    }
};
