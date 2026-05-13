<?php

// ── Chargement de tous les fichiers de routes ──────────────────────────────

require __DIR__.'/admin.php';
require __DIR__.'/gmp.php';
require __DIR__.'/espaces.php';
require __DIR__.'/support.php';
require __DIR__.'/workflow.php';
require __DIR__.'/pipeline.php';
require __DIR__.'/messagerie.php';
require __DIR__.'/chatbot.php';
require __DIR__.'/superadmin.php';
require __DIR__.'/settings.php';

use App\Http\Controllers\Courrier\CourrierController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

// Route racine - redirection vers login
Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware(['auth'])->prefix('courriers')->name('courriers.')->group(function () {
    Route::get('/', [CourrierController::class, 'index'])->name('index');
    Route::get('/liste', [CourrierController::class, 'liste'])->name('liste');

    Route::get('/entrant/creer', [CourrierController::class, 'createEntrant'])->name('create-entrant');
    Route::post('/entrant', [CourrierController::class, 'storeEntrant'])->name('store-entrant');

    Route::get('/sortant/creer', [CourrierController::class, 'createSortant'])->name('create-sortant');
    Route::post('/sortant', [CourrierController::class, 'storeSortant'])->name('store-sortant');

    Route::get('/{courrier}', [CourrierController::class, 'show'])->name('show');
    Route::put('/{courrier}', [CourrierController::class, 'update'])->name('update');
    Route::delete('/{courrier}', [CourrierController::class, 'destroy'])->name('destroy');

    Route::post('/{courrier}/affecter', [CourrierController::class, 'affecter'])->name('affecter');
    Route::post('/{courrier}/transferer', [CourrierController::class, 'transferer'])->name('transferer');
    Route::post('/{courrier}/statut', [CourrierController::class, 'changerStatut'])->name('changer-statut');
    Route::post('/{courrier}/archiver', [CourrierController::class, 'archiver'])->name('archiver');

    Route::post('/verifier-doublon', [CourrierController::class, 'verifierDoublon'])->name('verifier-doublon');
    Route::post('/document/upload', [CourrierController::class, 'uploadDocument'])->name('document.upload');
    Route::post('/commentaire', [CourrierController::class, 'ajouterCommentaire'])->name('commentaire');
    Route::post('/{courrier}/commentaire', [CourrierController::class, 'ajouterCommentaire'])->name('courrier.commentaire');
    Route::get('/document/{document}/telecharger', [CourrierController::class, 'telechargerDocument'])->name('telecharger-document');
    Route::get('/notification/{notification}/lu', [CourrierController::class, 'marquerNotificationLu'])->name('notification-lu');

    // Export routes
    Route::get('/export', [\App\Http\Controllers\Courrier\ExportController::class, 'export'])->name('export');
    Route::post('/export-zip', [\App\Http\Controllers\Courrier\ExportController::class, 'exportZip'])->name('export-zip');
});

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
});