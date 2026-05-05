<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Après inscription, rediriger vers la page d'attente au lieu du dashboard
        $this->app->singleton(
            \Laravel\Fortify\Contracts\RegisterResponse::class,
            function () {
                return new class implements \Laravel\Fortify\Contracts\RegisterResponse {
                    public function toResponse($request)
                    {
                        return redirect()->route('validation.en_attente');
                    }
                };
            }
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureAuthentication();
        $this->configureRateLimiting();
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);
    }

    /**
     * Configure Fortify authentication — page de connexion unifiée.
     * SuperAdmin et Utilisateur partagent le même formulaire /login.
     * SuperAdmin → redirigé vers /superadmin via HttpResponseException (sans passer par le guard web).
     * Utilisateur → Fortify gère la session web normalement.
     */
    private function configureAuthentication(): void
    {
        Fortify::authenticateUsing(function (Request $request) {
            $credentials = [
                'email' => $request->input('email'),
                'password' => $request->input('password'),
            ];

            // ── SuperAdmin ──────────────────────────────────────────────
            if (auth('superadmin')->attempt($credentials, $request->filled('remember'))) {
                $superAdmin = auth('superadmin')->user();

                if ($superAdmin->statut !== 'actif') {
                    auth('superadmin')->logout();
                    throw ValidationException::withMessages([
                        Fortify::username() => 'Ce compte SuperAdmin est désactivé.',
                    ]);
                }

                $superAdmin->update(['derniere_connexion' => now()]);
                $request->session()->regenerate();

                // Redirige directement sans passer par le guard web de Fortify
                throw new HttpResponseException(
                    redirect()->intended(route('superadmin.dashboard'))
                );
            }

            // ── Utilisateur normal ──────────────────────────────────────
            if (auth('web')->attempt($credentials, $request->filled('remember'))) {
                $user = auth('web')->user();

                if ($user->statut === 'en_attente') {
                    auth('web')->logout();
                    throw ValidationException::withMessages([
                        Fortify::username() => 'Votre compte est en attente d\'approbation par l\'administrateur.',
                    ]);
                }

                if ($user->statut !== 'actif') {
                    auth('web')->logout();
                    throw ValidationException::withMessages([
                        Fortify::username() => 'Votre compte est suspendu ou désactivé. Contactez votre administrateur.',
                    ]);
                }

                return $user;
            }

            // ── Échec ───────────────────────────────────────────────────
            throw ValidationException::withMessages([
                Fortify::username() => __('auth.failed'),
            ]);
        });
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'canRegister' => Features::enabled(Features::registration()),
            'status' => $request->session()->get('status'),
        ]));

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::verifyEmailView(fn (Request $request) => Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(fn () => Inertia::render('auth/register'));

        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));

        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });
    }
}

