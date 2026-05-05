<?php

use App\Http\Controllers\EspaceController;
use App\Http\Controllers\DossierController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::get('/espaces', [EspaceController::class, 'index'])->name('espaces.index');
    Route::post('/espaces', [EspaceController::class, 'store'])->name('espaces.store');
    Route::get('/espaces/{espace}', [EspaceController::class, 'show'])->name('espaces.show');
    Route::put('/espaces/{espace}', [EspaceController::class, 'update'])->name('espaces.update');
    Route::delete('/espaces/{espace}', [EspaceController::class, 'destroy'])->name('espaces.destroy');

    Route::get('/dossiers/{dossier}', [DossierController::class, 'show'])->name('dossiers.show');
    Route::post('/dossiers', [DossierController::class, 'store'])->name('dossiers.store');
    Route::post('/dossiers/bulk-destroy', [DossierController::class, 'bulkDestroy'])->name('dossiers.bulkDestroy');
    Route::post('/dossiers/bulk-export', [DossierController::class, 'bulkExport'])->name('dossiers.bulkExport');
    Route::put('/dossiers/{dossier}', [DossierController::class, 'update'])->name('dossiers.update');
    Route::delete('/dossiers/{dossier}', [DossierController::class, 'destroy'])->name('dossiers.destroy');
    Route::get('/dossiers/{dossier}/export', [DossierController::class, 'export'])->name('dossiers.export');
    Route::get('/dossiers/{dossier}/qr', [DossierController::class, 'qrCode'])->name('dossiers.qr');
});
