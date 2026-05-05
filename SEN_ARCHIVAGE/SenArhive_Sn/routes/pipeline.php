<?php

use App\Http\Controllers\PipelineController;
use App\Http\Controllers\PipelineInstanceController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    // ─── Templates de pipelines ─────────────────────────────────────────────
    Route::get('/pipelines', [PipelineController::class, 'index'])->name('pipelines.index');
    Route::post('/pipelines', [PipelineController::class, 'store'])->name('pipelines.store');
    Route::put('/pipelines/{pipeline}', [PipelineController::class, 'update'])->name('pipelines.update');
    Route::delete('/pipelines/{pipeline}', [PipelineController::class, 'destroy'])->name('pipelines.destroy');

    // ─── Instances de pipelines ──────────────────────────────────────────────
    Route::get('/pipelines/instances', [PipelineInstanceController::class, 'index'])->name('pipelines.instances.index');
    Route::post('/pipelines/instances', [PipelineInstanceController::class, 'store'])->name('pipelines.instances.store');
    Route::get('/pipelines/instances/{pipelineInstance}', [PipelineInstanceController::class, 'show'])->name('pipelines.instances.show');

    // ─── Actions sur l'instance ──────────────────────────────────────────────
    Route::post('/pipelines/instances/{pipelineInstance}/valider', [PipelineInstanceController::class, 'valider'])->name('pipelines.instances.valider');
    Route::post('/pipelines/instances/{pipelineInstance}/rejeter', [PipelineInstanceController::class, 'rejeter'])->name('pipelines.instances.rejeter');
    Route::post('/pipelines/instances/{pipelineInstance}/correction', [PipelineInstanceController::class, 'demanderCorrection'])->name('pipelines.instances.correction');

    // ─── Annotations sur une étape ───────────────────────────────────────────
    Route::post('/pipelines/etapes/{etapeInstance}/annoter', [PipelineInstanceController::class, 'annoter'])->name('pipelines.etapes.annoter');

    // ─── Réassignation d'une étape ───────────────────────────────────────────
    Route::post('/pipelines/etapes/{etapeInstance}/reassigner', [PipelineInstanceController::class, 'reassigner'])->name('pipelines.etapes.reassigner');
});
