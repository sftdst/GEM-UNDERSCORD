<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('courriers', function (Blueprint $table) {
            $table->foreignUuid('organisation_id')->nullable()->constrained('organisations')->nullOnDelete();
        });

        Schema::table('courrier_types', function (Blueprint $table) {
            $table->foreignUuid('organisation_id')->nullable()->constrained('organisations')->nullOnDelete();
        });

        Schema::table('courrier_statuts', function (Blueprint $table) {
            $table->foreignUuid('organisation_id')->nullable()->constrained('organisations')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('courriers', function (Blueprint $table) {
            $table->dropForeign(['organisation_id']);
            $table->dropColumn('organisation_id');
        });

        Schema::table('courrier_types', function (Blueprint $table) {
            $table->dropForeign(['organisation_id']);
            $table->dropColumn('organisation_id');
        });

        Schema::table('courrier_statuts', function (Blueprint $table) {
            $table->dropForeign(['organisation_id']);
            $table->dropColumn('organisation_id');
        });
    }
};