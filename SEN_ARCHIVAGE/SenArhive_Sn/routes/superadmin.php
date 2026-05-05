<?php

use App\Http\Controllers\SuperAdmin\AbonnementController;
use App\Http\Controllers\SuperAdmin\AuthController;
use App\Http\Controllers\SuperAdmin\DashboardController;
use App\Http\Controllers\SuperAdmin\DemandeAbonnementController;
use App\Http\Controllers\SuperAdmin\DemandeChangementPlanController;
use App\Http\Controllers\SuperAdmin\FonctionnaliteController;
use App\Http\Controllers\SuperAdmin\OrganisationController;
use App\Http\Controllers\SuperAdmin\PlanController;
use App\Http\Controllers\SuperAdmin\RapportUtilisateurController;
use App\Http\Controllers\SuperAdmin\SupportController;
use App\Http\Controllers\SuperAdmin\UtilisateurLogsController;
use App\Http\Controllers\SuperAdmin\VitrineController;
use Illuminate\Support\Facades\Route;

// Formulaire de connexion SuperAdmin (dédié)
Route::get('superadmin/login', [AuthController::class, 'showLoginForm'])
    ->middleware('guest:superadmin')
    ->name('superadmin.login');

Route::post('superadmin/login', [AuthController::class, 'login'])
    ->middleware('guest:superadmin')
    ->name('superadmin.login.post');

Route::middleware(['auth:superadmin', 'is_super_admin'])->prefix('superadmin')->name('superadmin.')->group(function () {

    // Logout
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');

    // Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Plans
    Route::resource('plans', PlanController::class);
    Route::post('plans/{plan}/activate', [PlanController::class, 'activate'])->name('plans.activate');
    Route::post('plans/{plan}/deactivate', [PlanController::class, 'deactivate'])->name('plans.deactivate');

    // Fonctionnalités
    Route::resource('fonctionnalites', FonctionnaliteController::class);
    Route::post('fonctionnalites/{fonctionnalite}/toggle', [FonctionnaliteController::class, 'toggle'])->name('fonctionnalites.toggle');

    // Organisations
    Route::resource('organisations', OrganisationController::class);
    Route::post('organisations/{organisation}/suspend', [OrganisationController::class, 'suspend'])->name('organisations.suspend');
    Route::post('organisations/{organisation}/activate', [OrganisationController::class, 'activate'])->name('organisations.activate');

    // Abonnements
    Route::resource('abonnements', AbonnementController::class);
    Route::post('abonnements/{abonnement}/renew', [AbonnementController::class, 'renew'])->name('abonnements.renew');
    Route::post('abonnements/{abonnement}/suspend', [AbonnementController::class, 'suspend'])->name('abonnements.suspend');
    Route::post('abonnements/{abonnement}/activate', [AbonnementController::class, 'activate'])->name('abonnements.activate');
    Route::post('abonnements/{abonnement}/terminate', [AbonnementController::class, 'terminate'])->name('abonnements.terminate');
    Route::get('abonnements/{abonnement}/factures', [AbonnementController::class, 'factures'])->name('abonnements.factures');

    // Demandes d'abonnement (legacy)
    Route::resource('demandes_abonnement', DemandeAbonnementController::class, ['only' => ['index', 'show']]);
    Route::post('demandes_abonnement/{id}/approuve', [DemandeAbonnementController::class, 'approuve'])->name('demandes_abonnement.approuve');
    Route::post('demandes_abonnement/{id}/rejette', [DemandeAbonnementController::class, 'rejette'])->name('demandes_abonnement.rejette');

    // Demandes de changement de plan
    Route::get('demandes_plan', [DemandeChangementPlanController::class, 'index'])->name('demandes_plan.index');
    Route::post('demandes_plan/{demandeChangementPlan}/approuver', [DemandeChangementPlanController::class, 'approuver'])->name('demandes_plan.approuver');
    Route::post('demandes_plan/{demandeChangementPlan}/rejeter', [DemandeChangementPlanController::class, 'rejeter'])->name('demandes_plan.rejeter');

    // Logs d'activité utilisateurs (toutes organisations)
    Route::get('utilisateurs/logs', [UtilisateurLogsController::class, 'index'])->name('utilisateurs.logs');
    Route::get('utilisateurs/logs/export', [UtilisateurLogsController::class, 'export'])->name('utilisateurs.logs.export');

    // Rapport connexions utilisateurs par organisation
    Route::get('utilisateurs/rapport', [RapportUtilisateurController::class, 'index'])->name('utilisateurs.rapport');
    Route::get('utilisateurs/rapport/export', [RapportUtilisateurController::class, 'export'])->name('utilisateurs.rapport.export');

    // Support tickets (vue globale toutes organisations)
    Route::get('support', [SupportController::class, 'index'])->name('support.index');
    Route::get('support/{ticketSupport}', [SupportController::class, 'show'])->name('support.show');
    Route::post('support/{ticketSupport}/reply', [SupportController::class, 'reply'])->name('support.reply');
    Route::post('support/{ticketSupport}/statut', [SupportController::class, 'updateStatut'])->name('support.statut');

    // Compteurs de notifications superadmin (JSON, polling frontend)
    Route::get('notifications/count', [SupportController::class, 'notificationsCount'])->name('notifications.count');

    // ── Page Vitrine (contenu dynamique landing page) ─────────────────────
    Route::get('vitrine', [VitrineController::class, 'index'])->name('vitrine.index');

    // Témoignages
    Route::get('vitrine/temoignages', [VitrineController::class, 'temoignages'])->name('vitrine.temoignages');
    Route::post('vitrine/temoignages', [VitrineController::class, 'temoignageStore'])->name('vitrine.temoignages.store');
    Route::put('vitrine/temoignages/{temoignage}', [VitrineController::class, 'temoignageUpdate'])->name('vitrine.temoignages.update');
    Route::delete('vitrine/temoignages/{temoignage}', [VitrineController::class, 'temoignageDestroy'])->name('vitrine.temoignages.destroy');

    // Partenaires
    Route::get('vitrine/partenaires', [VitrineController::class, 'partenaires'])->name('vitrine.partenaires');
    Route::post('vitrine/partenaires', [VitrineController::class, 'partenaireStore'])->name('vitrine.partenaires.store');
    Route::put('vitrine/partenaires/{partenaire}', [VitrineController::class, 'partenaireUpdate'])->name('vitrine.partenaires.update');
    Route::delete('vitrine/partenaires/{partenaire}', [VitrineController::class, 'partenaireDestroy'])->name('vitrine.partenaires.destroy');

    // Fonctionnalités vitrine
    Route::get('vitrine/fonctionnalites', [VitrineController::class, 'fonctionnalites'])->name('vitrine.fonctionnalites');
    Route::post('vitrine/fonctionnalites', [VitrineController::class, 'fonctionnaliteStore'])->name('vitrine.fonctionnalites.store');
    Route::put('vitrine/fonctionnalites/{fonctionnalite}', [VitrineController::class, 'fonctionnaliteUpdate'])->name('vitrine.fonctionnalites.update');
    Route::delete('vitrine/fonctionnalites/{fonctionnalite}', [VitrineController::class, 'fonctionnaliteDestroy'])->name('vitrine.fonctionnalites.destroy');

    // Médias (vidéos tutos + captures d'écran)
    Route::get('vitrine/medias', [VitrineController::class, 'medias'])->name('vitrine.medias');
    Route::post('vitrine/medias', [VitrineController::class, 'mediaStore'])->name('vitrine.medias.store');
    Route::put('vitrine/medias/{media}', [VitrineController::class, 'mediaUpdate'])->name('vitrine.medias.update');
    Route::delete('vitrine/medias/{media}', [VitrineController::class, 'mediaDestroy'])->name('vitrine.medias.destroy');
    Route::post('vitrine/medias/{media}/toggle', [VitrineController::class, 'mediaToggle'])->name('vitrine.medias.toggle');
});
