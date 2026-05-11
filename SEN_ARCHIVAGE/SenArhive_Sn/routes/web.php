<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Admin\PaiementController;
use App\Http\Controllers\DossierPublicController;
use App\Models\VitrineFonctionnalite;
use App\Models\VitrineMedia;
use App\Models\VitrinePartenaire;
use App\Models\VitrineTemoignage;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::redirect('/home', '/');

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    return Inertia::render('landing', [
        'temoignages'     => VitrineTemoignage::actif()->get(),
        'partenaires'     => VitrinePartenaire::actif()->get(),
        'fonctionnalites' => VitrineFonctionnalite::actif()->get(),
        'medias'          => VitrineMedia::actif()->get(),
    ]);
})->name('home');

Route::get('dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth'])
    ->name('dashboard');

// Page affichée quand l'organisation est désactivée (abonnement expiré > 30 j)
Route::get('/abonnement-expire', function () {
    $user = auth()->user();
    return Inertia::render('abonnement-expire', [
        'organisation' => $user?->organisation ? ['nom' => $user->organisation->nom] : null,
    ]);
})->middleware(['auth'])->name('abonnement.expire');

// Page affichée après inscription, en attente de validation superadmin
Route::get('/en-attente-validation', function () {
    $user = auth()->user();
    return Inertia::render('en-attente-validation', [
        'organisation' => $user?->organisation ? ['nom' => $user->organisation->nom] : null,
        'utilisateur'  => $user ? ['nom' => $user->nom, 'prenom' => $user->prenom, 'email' => $user->email] : null,
    ]);
})->middleware(['auth'])->name('validation.en_attente');

// QR Code public — consultation dossier sans authentification
Route::get('/public/dossier/{token}', [DossierPublicController::class, 'show'])
    ->name('dossier.public');

// Webhooks de paiement — sans authentification (appelés par les prestataires)
Route::post('/webhooks/paiement/{provider}', [PaiementController::class, 'webhook'])
    ->name('paiement.webhook')
    ->where('provider', 'wave|orange_money|carte|paydunya');

require __DIR__.'/settings.php';
require __DIR__.'/documents.php';
require __DIR__.'/espaces.php';
require __DIR__.'/workflow.php';
require __DIR__.'/pipeline.php';
require __DIR__.'/admin.php';
require __DIR__.'/support.php';
require __DIR__.'/chatbot.php';
require __DIR__.'/messagerie.php';
require __DIR__.'/superadmin.php';
require __DIR__.'/gmp.php';
