<?php

use App\Http\Controllers\Gmp\GmpDashboardController;
use App\Http\Controllers\Gmp\GmpAdminController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->prefix('gmp')->name('gmp.')->group(function () {

    // ── Tableau de bord ───────────────────────────────────────────────────────
    Route::get('/', [GmpDashboardController::class, 'dashboard'])->name('dashboard');

    // ── PPM ───────────────────────────────────────────────────────────────────
    Route::get('/ppm',            [GmpDashboardController::class, 'ppm'])->name('ppm');
    Route::post('/ppm',           [GmpDashboardController::class, 'storePpm'])->name('ppm.store');
    Route::put('/ppm/{id}',       [GmpDashboardController::class, 'updatePpm'])->name('ppm.update');

    // ── Appels d'offres ───────────────────────────────────────────────────────
    Route::get('/appels-offres',      [GmpDashboardController::class, 'appelsOffres'])->name('ao');
    Route::post('/appels-offres',     [GmpDashboardController::class, 'storeAppelOffre'])->name('ao.store');
    Route::put('/appels-offres/{id}', [GmpDashboardController::class, 'updateAppelOffre'])->name('ao.update');

    // ── Marchés ───────────────────────────────────────────────────────────────
    Route::get('/marches',      [GmpDashboardController::class, 'marches'])->name('marches');
    Route::post('/marches',     [GmpDashboardController::class, 'storeMarche'])->name('marches.store');
    Route::put('/marches/{id}', [GmpDashboardController::class, 'updateMarche'])->name('marches.update');

    // ── Fournisseurs ──────────────────────────────────────────────────────────
    Route::get('/fournisseurs',      [GmpDashboardController::class, 'fournisseurs'])->name('fournisseurs');
    Route::post('/fournisseurs',     [GmpDashboardController::class, 'storeFournisseur'])->name('fournisseurs.store');
    Route::put('/fournisseurs/{id}', [GmpDashboardController::class, 'updateFournisseur'])->name('fournisseurs.update');

    // ── Alertes & Rapports ────────────────────────────────────────────────────
    Route::get('/alertes',               [GmpDashboardController::class, 'alertes'])->name('alertes');
    Route::post('/alertes/{id}/traiter', [GmpDashboardController::class, 'traiterAlerte'])->name('alertes.traiter');
    Route::get('/rapports',              [GmpDashboardController::class, 'rapports'])->name('rapports');

    // ── Paramétrage (admin) ───────────────────────────────────────────────────
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/exercices',         [GmpAdminController::class, 'exercices'])->name('exercices');
        Route::post('/exercices',        [GmpAdminController::class, 'storeExercice'])->name('exercices.store');
        Route::put('/exercices/{id}',    [GmpAdminController::class, 'updateExercice'])->name('exercices.update');

        Route::get('/types-marche',        [GmpAdminController::class, 'typesMarche'])->name('types-marche');
        Route::post('/types-marche',       [GmpAdminController::class, 'storeTypeMarche'])->name('types-marche.store');
        Route::put('/types-marche/{id}',   [GmpAdminController::class, 'updateTypeMarche'])->name('types-marche.update');
        Route::delete('/types-marche/{id}',[GmpAdminController::class, 'destroyTypeMarche'])->name('types-marche.destroy');

        Route::get('/modes-passation',        [GmpAdminController::class, 'modesPassation'])->name('modes-passation');
        Route::post('/modes-passation',       [GmpAdminController::class, 'storeModePassation'])->name('modes-passation.store');
        Route::put('/modes-passation/{id}',   [GmpAdminController::class, 'updateModePassation'])->name('modes-passation.update');
        Route::delete('/modes-passation/{id}',[GmpAdminController::class, 'destroyModePassation'])->name('modes-passation.destroy');

        Route::get('/secteurs',        [GmpAdminController::class, 'secteurs'])->name('secteurs');
        Route::post('/secteurs',       [GmpAdminController::class, 'storeSecteur'])->name('secteurs.store');
        Route::put('/secteurs/{id}',   [GmpAdminController::class, 'updateSecteur'])->name('secteurs.update');
        Route::delete('/secteurs/{id}',[GmpAdminController::class, 'destroySecteur'])->name('secteurs.destroy');

        Route::get('/seuils', [GmpAdminController::class, 'seuils'])->name('seuils');
    });
});
