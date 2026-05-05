<?php

use App\Console\Commands\CheckAbonnementExpiration;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Vérification quotidienne des expirations d'abonnements
// Règle J-5 : notification admins + désactivation orgs après 30 j d'expiration
Schedule::command(CheckAbonnementExpiration::class)->dailyAt('06:00');
