<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\VitrineFonctionnalite;
use App\Models\VitrineMedia;
use App\Models\VitrinePartenaire;
use App\Models\VitrineTemoignage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VitrineController extends Controller
{
    // ── Dashboard vitrine ────────────────────────────────────────────────────

    public function index()
    {
        return Inertia::render('superadmin/vitrine/index', [
            'stats' => [
                'temoignages'    => VitrineTemoignage::count(),
                'partenaires'    => VitrinePartenaire::count(),
                'fonctionnalites'=> VitrineFonctionnalite::count(),
                'videos'         => VitrineMedia::where('type', 'video')->count(),
                'screenshots'    => VitrineMedia::where('type', 'screenshot')->count(),
            ],
        ]);
    }

    // ── Témoignages ──────────────────────────────────────────────────────────

    public function temoignages()
    {
        return Inertia::render('superadmin/vitrine/temoignages', [
            'temoignages' => VitrineTemoignage::orderBy('ordre')->get(),
        ]);
    }

    public function temoignageStore(Request $request)
    {
        $data = $request->validate([
            'nom'       => 'required|string|max:100',
            'role'      => 'required|string|max:100',
            'entreprise'=> 'required|string|max:150',
            'initiales' => 'required|string|max:5',
            'photo_url' => 'nullable|url|max:500',
            'contenu'   => 'required|string|max:600',
            'note'      => 'required|integer|min:1|max:5',
            'ordre'     => 'required|integer|min:0',
            'actif'     => 'boolean',
        ]);

        VitrineTemoignage::create($data);

        return redirect()->route('superadmin.vitrine.temoignages')
                         ->with('success', 'Témoignage ajouté avec succès');
    }

    public function temoignageUpdate(Request $request, VitrineTemoignage $temoignage)
    {
        $data = $request->validate([
            'nom'       => 'required|string|max:100',
            'role'      => 'required|string|max:100',
            'entreprise'=> 'required|string|max:150',
            'initiales' => 'required|string|max:5',
            'photo_url' => 'nullable|url|max:500',
            'contenu'   => 'required|string|max:600',
            'note'      => 'required|integer|min:1|max:5',
            'ordre'     => 'required|integer|min:0',
            'actif'     => 'boolean',
        ]);

        $temoignage->update($data);

        return redirect()->route('superadmin.vitrine.temoignages')
                         ->with('success', 'Témoignage mis à jour');
    }

    public function temoignageDestroy(VitrineTemoignage $temoignage)
    {
        $temoignage->delete();

        return redirect()->route('superadmin.vitrine.temoignages')
                         ->with('success', 'Témoignage supprimé');
    }

    // ── Partenaires ──────────────────────────────────────────────────────────

    public function partenaires()
    {
        return Inertia::render('superadmin/vitrine/partenaires', [
            'partenaires' => VitrinePartenaire::orderBy('ordre')->get(),
        ]);
    }

    public function partenaireStore(Request $request)
    {
        $data = $request->validate([
            'nom'        => 'required|string|max:150',
            'logo_url'   => 'nullable|url|max:500',
            'site_web'   => 'nullable|url|max:500',
            'description'=> 'nullable|string|max:300',
            'ordre'      => 'required|integer|min:0',
            'actif'      => 'boolean',
        ]);

        VitrinePartenaire::create($data);

        return redirect()->route('superadmin.vitrine.partenaires')
                         ->with('success', 'Partenaire ajouté');
    }

    public function partenaireUpdate(Request $request, VitrinePartenaire $partenaire)
    {
        $data = $request->validate([
            'nom'        => 'required|string|max:150',
            'logo_url'   => 'nullable|url|max:500',
            'site_web'   => 'nullable|url|max:500',
            'description'=> 'nullable|string|max:300',
            'ordre'      => 'required|integer|min:0',
            'actif'      => 'boolean',
        ]);

        $partenaire->update($data);

        return redirect()->route('superadmin.vitrine.partenaires')
                         ->with('success', 'Partenaire mis à jour');
    }

    public function partenaireDestroy(VitrinePartenaire $partenaire)
    {
        $partenaire->delete();

        return redirect()->route('superadmin.vitrine.partenaires')
                         ->with('success', 'Partenaire supprimé');
    }

    // ── Fonctionnalités vitrine ───────────────────────────────────────────────

    public function fonctionnalites()
    {
        return Inertia::render('superadmin/vitrine/fonctionnalites', [
            'fonctionnalites' => VitrineFonctionnalite::orderBy('ordre')->get(),
        ]);
    }

    public function fonctionnaliteStore(Request $request)
    {
        $data = $request->validate([
            'icone'         => 'required|string|max:50',
            'titre'         => 'required|string|max:150',
            'description'   => 'required|string|max:500',
            'couleur_bg'    => 'nullable|string|max:100',
            'couleur_icone' => 'nullable|string|max:100',
            'ordre'         => 'required|integer|min:0',
            'actif'         => 'boolean',
        ]);

        VitrineFonctionnalite::create($data);

        return redirect()->route('superadmin.vitrine.fonctionnalites')
                         ->with('success', 'Fonctionnalité ajoutée');
    }

    public function fonctionnaliteUpdate(Request $request, VitrineFonctionnalite $fonctionnalite)
    {
        $data = $request->validate([
            'icone'         => 'required|string|max:50',
            'titre'         => 'required|string|max:150',
            'description'   => 'required|string|max:500',
            'couleur_bg'    => 'nullable|string|max:100',
            'couleur_icone' => 'nullable|string|max:100',
            'ordre'         => 'required|integer|min:0',
            'actif'         => 'boolean',
        ]);

        $fonctionnalite->update($data);

        return redirect()->route('superadmin.vitrine.fonctionnalites')
                         ->with('success', 'Fonctionnalité mise à jour');
    }

    public function fonctionnaliteDestroy(VitrineFonctionnalite $fonctionnalite)
    {
        $fonctionnalite->delete();

        return redirect()->route('superadmin.vitrine.fonctionnalites')
                         ->with('success', 'Fonctionnalité supprimée');
    }

    // ── Médias (vidéos + captures) ───────────────────────────────────────────

    public function medias()
    {
        return Inertia::render('superadmin/vitrine/medias', [
            'medias'   => VitrineMedia::orderBy('type')->orderBy('ordre')->get(),
            'sections' => VitrineFonctionnalite::orderBy('ordre')->pluck('titre'),
        ]);
    }

    public function mediaStore(Request $request)
    {
        $data = $request->validate([
            'type'            => 'required|in:video,screenshot',
            'titre'           => 'required|string|max:200',
            'description'     => 'nullable|string|max:500',
            'url'             => 'required|string|max:500',
            'thumbnail_url'   => 'nullable|url|max:500',
            'section'         => 'nullable|string|max:150',
            'duree_secondes'  => 'nullable|integer|min:1',
            'ordre'           => 'required|integer|min:0',
            'actif'           => 'boolean',
        ]);

        VitrineMedia::create($data);

        return redirect()->route('superadmin.vitrine.medias')
                         ->with('success', 'Média ajouté');
    }

    public function mediaUpdate(Request $request, VitrineMedia $media)
    {
        $data = $request->validate([
            'type'            => 'required|in:video,screenshot',
            'titre'           => 'required|string|max:200',
            'description'     => 'nullable|string|max:500',
            'url'             => 'required|string|max:500',
            'thumbnail_url'   => 'nullable|url|max:500',
            'section'         => 'nullable|string|max:150',
            'duree_secondes'  => 'nullable|integer|min:1',
            'ordre'           => 'required|integer|min:0',
            'actif'           => 'boolean',
        ]);

        $media->update($data);

        return redirect()->route('superadmin.vitrine.medias')
                         ->with('success', 'Média mis à jour');
    }

    public function mediaDestroy(VitrineMedia $media)
    {
        $media->delete();

        return redirect()->route('superadmin.vitrine.medias')
                         ->with('success', 'Média supprimé');
    }

    public function mediaToggle(VitrineMedia $media)
    {
        $media->update(['actif' => ! $media->actif]);

        return redirect()->back()
                         ->with('success', $media->actif ? 'Média activé' : 'Média désactivé');
    }
}
