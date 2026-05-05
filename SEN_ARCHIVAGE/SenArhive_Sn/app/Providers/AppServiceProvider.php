<?php

namespace App\Providers;

use App\Listeners\RedirectSuperAdminToDashboard;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Symfony\Component\Mailer\Transport\Smtp\EsmtpTransport;
use Symfony\Component\Mailer\Transport\Smtp\Stream\SocketStream;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureListeners();
        $this->configureMailSsl();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }

    /**
     * Configure event listeners.
     */
    protected function configureListeners(): void
    {
        Event::listen(Login::class, RedirectSuperAdminToDashboard::class);
    }

    /**
     * Désactive la vérification du certificat SSL du serveur SMTP quand
     * MAIL_VERIFY_PEER=false (hébergements mutualisés avec certificat wildcard).
     */
    protected function configureMailSsl(): void
    {
        if (config('mail.mailers.smtp.verify_peer', true) !== false) {
            return;
        }

        $this->app->resolving(\Illuminate\Mail\Mailer::class, function (\Illuminate\Mail\Mailer $mailer) {
            $transport = $mailer->getSymfonyTransport();

            if ($transport instanceof EsmtpTransport) {
                $stream = $transport->getStream();

                if ($stream instanceof SocketStream) {
                    $stream->setStreamOptions([
                        'ssl' => [
                            'verify_peer'       => false,
                            'verify_peer_name'  => false,
                            'allow_self_signed' => true,
                        ],
                    ]);
                }
            }
        });
    }
}
