<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE documents ADD COLUMN IF NOT EXISTS vecteur_recherche tsvector");
        DB::statement("CREATE INDEX IF NOT EXISTS idx_documents_fts ON documents USING GIN(vecteur_recherche)");
        DB::statement("CREATE INDEX IF NOT EXISTS idx_documents_metadonnees ON documents USING GIN(metadonnees)");

        DB::statement("
            CREATE OR REPLACE FUNCTION update_document_search_vector()
            RETURNS TRIGGER AS \$\$
            BEGIN
                NEW.vecteur_recherche :=
                    setweight(to_tsvector('french', COALESCE(NEW.titre, '')), 'A') ||
                    setweight(to_tsvector('french', COALESCE(NEW.description, '')), 'B') ||
                    setweight(to_tsvector('french', COALESCE(NEW.texte_extrait, '')), 'C');
                RETURN NEW;
            END;
            \$\$ LANGUAGE plpgsql;
        ");

        DB::statement("
            CREATE TRIGGER trg_documents_search_vector
            BEFORE INSERT OR UPDATE OF titre, description, texte_extrait ON documents
            FOR EACH ROW
            EXECUTE FUNCTION update_document_search_vector();
        ");
    }

    public function down(): void
    {
        DB::statement("DROP TRIGGER IF EXISTS trg_documents_search_vector ON documents");
        DB::statement("DROP FUNCTION IF EXISTS update_document_search_vector()");
        DB::statement("DROP INDEX IF EXISTS idx_documents_fts");
        DB::statement("DROP INDEX IF EXISTS idx_documents_metadonnees");
        DB::statement("ALTER TABLE documents DROP COLUMN IF EXISTS vecteur_recherche");
    }
};
