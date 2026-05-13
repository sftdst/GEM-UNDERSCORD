<?php

namespace App\Services;

use App\Models\Document;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Schema;

class DocumentSearchService
{
    public function search(string $query, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $builder = Document::query()
            ->with(['createur', 'tags', 'dossier', 'categorie']);

        // Filtres de colonne (toujours disponibles)
        if (!empty($filters['service_id'])) {
            $builder->where('service_id', $filters['service_id']);
        }
        if (!empty($filters['dossier_id'])) {
            $builder->where('dossier_id', $filters['dossier_id']);
        }
        if (!empty($filters['categorie_id'])) {
            $builder->where('categorie_id', $filters['categorie_id']);
        }
        if (!empty($filters['extension'])) {
            $builder->where('extension', strtolower(trim($filters['extension'])));
        }
        if (!empty($filters['statut'])) {
            $builder->where('statut', $filters['statut']);
        }
        if (!empty($filters['date_from'])) {
            $builder->whereDate('created_at', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $builder->whereDate('created_at', '<=', $filters['date_to']);
        }
        if (!empty($filters['tag_ids']) && is_array($filters['tag_ids'])) {
            $builder->whereHas('tags', function ($q) use ($filters) {
                $q->whereIn('tags.id', $filters['tag_ids']);
            });
        }
        if (!empty($filters['numero_document'])) {
            $builder->where('numero_document', 'ilike', '%' . trim($filters['numero_document']) . '%');
        }
        if (!empty($filters['date_document'])) {
            $builder->whereDate('date_document', $filters['date_document']);
        }

        // Recherche textuelle — utiliser FTS si la colonne existe (PostgreSQL), sinon LIKE (SQLite)
        if (!empty($query)) {
            $hasFtsColumn = Schema::hasColumn('documents', 'vecteur_recherche');

            if ($hasFtsColumn) {
                $builder->where(function ($b) use ($query) {
                    $b->whereRaw("vecteur_recherche @@ plainto_tsquery('french', ?)", [$query])
                      ->orWhere('numero_document', 'ilike', '%' . $query . '%')
                      ->orWhere('titre', 'ilike', '%' . $query . '%');
                })->orderByRaw(
                    "ts_rank(vecteur_recherche, plainto_tsquery('french', ?)) DESC",
                    [$query]
                );
            } else {
                $builder->where(function ($b) use ($query) {
                    $b->where('titre', 'ilike', '%' . $query . '%')
                      ->orWhere('description', 'ilike', '%' . $query . '%')
                      ->orWhere('texte_extrait', 'ilike', '%' . $query . '%')
                      ->orWhere('numero_document', 'ilike', '%' . $query . '%');
                });
            }
        }

        if (empty($query)) {
            $builder->latest('created_at');
        }

        return $builder->paginate($perPage)->withQueryString();
    }
}