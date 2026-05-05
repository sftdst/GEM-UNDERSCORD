<?php

use App\Http\Controllers\WorkflowController;
use App\Http\Controllers\InstanceWorkflowController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'plan.feature:workflow'])->group(function () {
    Route::get('/workflows', [WorkflowController::class, 'index'])->name('workflows.index');
    Route::post('/workflows', [WorkflowController::class, 'store'])->name('workflows.store');
    Route::put('/workflows/{workflow}', [WorkflowController::class, 'update'])->name('workflows.update');
    Route::delete('/workflows/{workflow}', [WorkflowController::class, 'destroy'])->name('workflows.destroy');

    Route::get('/workflows/instances', [InstanceWorkflowController::class, 'index'])->name('workflows.instances.index');
    Route::get('/workflows/instances/{instance}', [InstanceWorkflowController::class, 'show'])->name('workflows.instances.show');
    Route::post('/workflows/instances', [InstanceWorkflowController::class, 'store'])->name('workflows.instances.store');
    Route::post('/workflows/instances/{instance}/approve', [InstanceWorkflowController::class, 'approve'])->name('workflows.instances.approve');
    Route::post('/workflows/instances/{instance}/reject', [InstanceWorkflowController::class, 'reject'])->name('workflows.instances.reject');
});
