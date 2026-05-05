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
        Schema::table('tickets_support', function (Blueprint $table) {
            $table->boolean('vu_superadmin')->default(false)->after('statut');
        });
    }

    public function down(): void
    {
        Schema::table('tickets_support', function (Blueprint $table) {
            $table->dropColumn('vu_superadmin');
        });
    }
};
