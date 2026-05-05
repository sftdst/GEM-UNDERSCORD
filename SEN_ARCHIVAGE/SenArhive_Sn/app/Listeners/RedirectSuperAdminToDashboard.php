<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;

class RedirectSuperAdminToDashboard
{
    /**
     * Handle the event.
     */
    public function handle(Login $event): void
    {
        // Mettre un flag pour indiquer qu'on vient de se connecter et que c'est un superadmin
        if (auth('superadmin')->check()) {
            session()->put('just_logged_in_as_superadmin', true);
        }
    }
}

