<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('configurations_mail', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organisation_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('mailer')->default('smtp');       // smtp, sendmail, mailgun
            $table->string('host')->default('');
            $table->unsignedSmallInteger('port')->default(587);
            $table->string('username')->nullable();
            $table->text('password')->nullable();            // chiffré via cast
            $table->string('encryption')->nullable();        // tls, ssl, null
            $table->string('from_address')->default('');
            $table->string('from_name')->default('');
            $table->boolean('actif')->default(false);
            $table->timestamps();

            $table->unique('organisation_id');               // une config par organisation
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('configurations_mail');
    }
};
