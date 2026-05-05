<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Mail\TicketReponseMail;
use App\Models\DemandeChangementPlan;
use App\Models\DemandeEssai;
use App\Models\MessageTicket;
use App\Models\NotificationCustom;
use App\Models\TicketSupport;
use App\Scopes\OrganisationScope;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class SupportController extends Controller
{
    public function index(Request $request)
    {
        $statut = $request->input('statut', 'tous');

        $query = TicketSupport::withoutGlobalScope(OrganisationScope::class)
            ->with(['utilisateur:id,nom,prenom,email', 'organisation:id,nom'])
            ->latest();

        if ($statut !== 'tous') {
            $query->where('statut', $statut);
        }

        $tickets = $query->get();

        return Inertia::render('superadmin/support/index', [
            'tickets' => $tickets,
            'statut'  => $statut,
        ]);
    }

    public function show(TicketSupport $ticketSupport)
    {
        // Marquer comme vu par le superadmin → disparaît du badge
        if (!$ticketSupport->vu_superadmin) {
            $ticketSupport->update(['vu_superadmin' => true]);
        }

        $ticketSupport->load([
            'messages.utilisateur:id,nom,prenom',
            'utilisateur:id,nom,prenom,email',
            'organisation:id,nom',
        ]);

        return Inertia::render('superadmin/support/show', [
            'ticket' => $ticketSupport,
        ]);
    }

    public function reply(Request $request, TicketSupport $ticketSupport)
    {
        $validated = $request->validate([
            'message' => 'required|string',
        ]);

        MessageTicket::create([
            'ticket_id'      => $ticketSupport->id,
            'utilisateur_id' => null, // superadmin n'est pas un utilisateur
            'message'        => $validated['message'],
            'est_interne'    => false,
        ]);

        if ($ticketSupport->statut === 'ouvert') {
            $ticketSupport->update(['statut' => 'en_cours']);
        }

        // Notification in-app + email pour l'auteur du ticket
        $auteur = $ticketSupport->utilisateur()->first();
        if ($auteur) {
            NotificationCustom::create([
                'utilisateur_id' => $auteur->id,
                'acteur_id'      => auth('superadmin')->id(),
                'type'           => 'ticket_reponse',
                'titre'          => 'Réponse à votre ticket de support',
                'message'        => "Le support a répondu à votre ticket : {$ticketSupport->sujet}",
                'lien'           => "/support/{$ticketSupport->id}",
                'lu'             => false,
            ]);

            if ($auteur->email) {
                Mail::to($auteur->email)->send(new TicketReponseMail($ticketSupport, $validated['message']));
            }
        }

        return redirect()->back()->with('success', 'Réponse envoyée.');
    }

    public function updateStatut(Request $request, TicketSupport $ticketSupport)
    {
        $validated = $request->validate([
            'statut' => 'required|in:ouvert,en_cours,resolu,ferme',
        ]);

        $ticketSupport->update(['statut' => $validated['statut']]);

        return redirect()->back()->with('success', 'Statut mis à jour.');
    }

    /**
     * Endpoint JSON pour le badge de notifications superadmin (polling frontend).
     */
    public function notificationsCount()
    {
        $tickets = TicketSupport::withoutGlobalScope(OrganisationScope::class)
            ->whereIn('statut', ['ouvert', 'en_cours'])
            ->where('vu_superadmin', false)
            ->count();

        $demandesChangement = DemandeChangementPlan::where('statut', 'en_attente')->count();
        $demandesEssai      = DemandeEssai::where('statut', 'en_attente')->count();
        $demandes           = $demandesChangement + $demandesEssai;

        return response()->json([
            'tickets_ouverts'    => $tickets,
            'demandes_plan'      => $demandes,
            'total'              => $tickets + $demandes,
        ]);
    }
}
