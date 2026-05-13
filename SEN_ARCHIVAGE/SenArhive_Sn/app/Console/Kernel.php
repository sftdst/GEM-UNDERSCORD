<?php

namespace App\Console;

use App\Console\Commands\CheckAbonnementExpiration;
use App\Console\Commands\SendCourrierReminders;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');
    }

    protected function schedule(Schedule $schedule): void
    {
        // Vérification des abonnements - quotidien à 8h
        $schedule->command('abonnement:check-expiration')->dailyAt('08:00');

        // Envoi des rappels courriers - toutes les heures
        $schedule->command('courriers:reminders')->hourly();
    }
}