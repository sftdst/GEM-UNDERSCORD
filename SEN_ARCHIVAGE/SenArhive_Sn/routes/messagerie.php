<?php

use App\Http\Controllers\MessagerieController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::get('/messagerie', [MessagerieController::class, 'index'])->name('messagerie.index');
    Route::get('/messagerie/non-lus', [MessagerieController::class, 'unread'])->name('messagerie.unread');
    Route::get('/messagerie/{utilisateur}', [MessagerieController::class, 'show'])->name('messagerie.show');
    Route::post('/messagerie', [MessagerieController::class, 'store'])->name('messagerie.store');
    Route::post('/messagerie/{utilisateur}/lus', [MessagerieController::class, 'markRead'])->name('messagerie.markRead');
});
