<?php

use App\Http\Controllers\TicketController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::get('/support', [TicketController::class, 'index'])->name('support.index');
    Route::post('/support', [TicketController::class, 'store'])->name('support.store');
    Route::get('/support/{ticket}', [TicketController::class, 'show'])->name('support.show');
    Route::post('/support/{ticket}/reply', [TicketController::class, 'reply'])->name('support.reply');

    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.readAll');
});
