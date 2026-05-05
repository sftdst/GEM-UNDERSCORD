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
        Schema::create('messages_internes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('expediteur_id');
            $table->uuid('destinataire_id');
            $table->text('contenu');
            $table->uuid('document_id')->nullable();
            $table->boolean('lu')->default(false);
            $table->timestamp('lu_le')->nullable();
            $table->timestamps();

            $table->foreign('expediteur_id')->references('id')->on('utilisateurs')->onDelete('cascade');
            $table->foreign('destinataire_id')->references('id')->on('utilisateurs')->onDelete('cascade');
            $table->foreign('document_id')->references('id')->on('documents')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages_internes');
    }
};
