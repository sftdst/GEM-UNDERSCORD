<?php

use App\Http\Controllers\Admin\UtilisateurController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\GroupeController;
use App\Http\Controllers\Admin\AbonnementController;
use App\Http\Controllers\Admin\FactureController;
use App\Http\Controllers\Admin\AuditController;
use App\Http\Controllers\Admin\OrganisationController;
use App\Http\Controllers\Admin\CategorieController;
use App\Http\Controllers\Admin\TagController;
use App\Http\Controllers\Admin\DepartementController;
use App\Http\Controllers\Admin\ServiceController;
use App\Http\Controllers\Admin\PaiementController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/utilisateurs', [UtilisateurController::class, 'index'])->name('utilisateurs.index');
    Route::post('/utilisateurs', [UtilisateurController::class, 'store'])->name('utilisateurs.store');
    Route::put('/utilisateurs/{utilisateur}', [UtilisateurController::class, 'update'])->name('utilisateurs.update');
    Route::delete('/utilisateurs/{utilisateur}', [UtilisateurController::class, 'destroy'])->name('utilisateurs.destroy');

    Route::get('/roles', [RoleController::class, 'index'])->name('roles.index');
    Route::post('/roles', [RoleController::class, 'store'])->name('roles.store');
    Route::put('/roles/{role}', [RoleController::class, 'update'])->name('roles.update');
    Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');

    Route::get('/groupes', [GroupeController::class, 'index'])->name('groupes.index');
    Route::post('/groupes', [GroupeController::class, 'store'])->name('groupes.store');
    Route::put('/groupes/{groupe}', [GroupeController::class, 'update'])->name('groupes.update');
    Route::delete('/groupes/{groupe}', [GroupeController::class, 'destroy'])->name('groupes.destroy');
    Route::post('/groupes/{groupe}/utilisateurs', [GroupeController::class, 'addUtilisateur'])->name('groupes.utilisateurs.add');
    Route::delete('/groupes/{groupe}/utilisateurs/{utilisateur}', [GroupeController::class, 'removeUtilisateur'])->name('groupes.utilisateurs.remove');

    Route::get('/abonnement', [AbonnementController::class, 'index'])->name('abonnement.index');
    Route::post('/abonnement/demander-changement', [AbonnementController::class, 'demanderChangement'])->name('abonnement.demander_changement');
    Route::post('/abonnement/annuler-demande', [AbonnementController::class, 'annulerDemande'])->name('abonnement.annuler_demande');
    Route::get('/factures', [FactureController::class, 'index'])->name('factures.index');

    // Paiement PayDunya (Wave, Orange Money, carte)
    Route::post('/paiement/initier', [PaiementController::class, 'initier'])->name('paiement.initier');
    Route::get('/audit', [AuditController::class, 'index'])->name('audit.index')->middleware('plan.feature:audit');

    Route::get('/organisation', [OrganisationController::class, 'index'])->name('organisation.index');
    Route::put('/organisation', [OrganisationController::class, 'update'])->name('organisation.update');

    Route::get('/categories', [CategorieController::class, 'index'])->name('categories.index');
    Route::post('/categories', [CategorieController::class, 'store'])->name('categories.store');
    Route::put('/categories/{categorie}', [CategorieController::class, 'update'])->name('categories.update');
    Route::delete('/categories/{categorie}', [CategorieController::class, 'destroy'])->name('categories.destroy');

    Route::get('/tags', [TagController::class, 'index'])->name('tags.index');
    Route::post('/tags', [TagController::class, 'store'])->name('tags.store');
    Route::put('/tags/{tag}', [TagController::class, 'update'])->name('tags.update');
    Route::delete('/tags/{tag}', [TagController::class, 'destroy'])->name('tags.destroy');

    Route::get('/departements', [DepartementController::class, 'index'])->name('departements.index');
    Route::post('/departements', [DepartementController::class, 'store'])->name('departements.store');
    Route::put('/departements/{departement}', [DepartementController::class, 'update'])->name('departements.update');
    Route::delete('/departements/{departement}', [DepartementController::class, 'destroy'])->name('departements.destroy');

    Route::get('/services', [ServiceController::class, 'index'])->name('services.index');
    Route::post('/services', [ServiceController::class, 'store'])->name('services.store');
    Route::put('/services/{service}', [ServiceController::class, 'update'])->name('services.update');
    Route::delete('/services/{service}', [ServiceController::class, 'destroy'])->name('services.destroy');
});
