<?php

use App\Http\Controllers\DocumentAiController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\DocumentEditorController;
use App\Http\Controllers\CommentaireController;
use App\Http\Controllers\ShareLinkController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::get('/documents', [DocumentController::class, 'index'])->name('documents.index');
    Route::post('/documents', [DocumentController::class, 'store'])->name('documents.store');
    Route::post('/documents/scan', [DocumentController::class, 'storeScan'])->name('documents.scan');
    Route::post('/documents/bulk-upload', [DocumentController::class, 'storeBulk'])->name('documents.bulk-upload');
    Route::post('/documents/bulk-download', [DocumentController::class, 'bulkDownload'])->name('documents.bulk-download');
    Route::post('/documents/fusion', [DocumentController::class, 'fusion'])->name('documents.fusion');
    Route::get('/documents/suggest-numero', [DocumentController::class, 'suggestNumero'])->name('documents.suggest-numero');
    Route::get('/documents/{document}', [DocumentController::class, 'show'])->name('documents.show');
    Route::put('/documents/{document}', [DocumentController::class, 'update'])->name('documents.update');
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');
    Route::get('/documents/{document}/download', [DocumentController::class, 'download'])->name('documents.download');
    Route::get('/documents/{document}/preview', [DocumentController::class, 'preview'])->name('documents.preview');
    Route::post('/documents/{document}/sign', [DocumentController::class, 'sign'])->name('documents.sign')->middleware('plan.feature:signature_electronique');
    Route::post('/documents/{document}/versions', [DocumentController::class, 'uploadVersion'])->name('documents.versions.store');
    Route::post('/documents/{document}/ocr', [DocumentController::class, 'ocr'])->name('documents.ocr');
    Route::post('/documents/{document}/email', [DocumentController::class, 'sendByEmail'])->name('documents.email');
    Route::post('/documents/{document}/ask', [DocumentAiController::class, 'ask'])->name('documents.ask');

    // Routes pour l'édition des documents Word/Excel
    Route::get('/documents/{document}/edit', [DocumentEditorController::class, 'edit'])->name('documents.edit');
    Route::post('/documents/{document}/editor/save', [DocumentEditorController::class, 'save'])->name('documents.editor.save');
    Route::get('/documents/{document}/editor/preview', [DocumentEditorController::class, 'preview'])->name('documents.editor.preview');

    Route::post('/commentaires', [CommentaireController::class, 'store'])->name('commentaires.store');
    Route::put('/commentaires/{commentaire}', [CommentaireController::class, 'update'])->name('commentaires.update');
    Route::delete('/commentaires/{commentaire}', [CommentaireController::class, 'destroy'])->name('commentaires.destroy');
    Route::post('/commentaires/{commentaire}/resolve', [CommentaireController::class, 'resolve'])->name('commentaires.resolve');

    Route::middleware('plan.feature:partage')->group(function () {
        Route::get('/partage', [ShareLinkController::class, 'index'])->name('partage.index');
        Route::post('/partage', [ShareLinkController::class, 'store'])->name('partage.store');
        Route::post('/partage/bulk', [ShareLinkController::class, 'bulkStore'])->name('partage.bulk');
        Route::delete('/partage/{lienPartage}', [ShareLinkController::class, 'destroy'])->name('partage.destroy');
    });
});

Route::get('/s/{token}', [ShareLinkController::class, 'showPublic'])->name('partage.public');
Route::post('/s/{token}/verify', [ShareLinkController::class, 'verifyPassword'])->name('partage.verify');
Route::get('/s/{token}/download', [ShareLinkController::class, 'downloadPublic'])->name('partage.download');
