<?php

namespace App\Http\Controllers;

use App\Models\MessageTicket;
use App\Models\TicketSupport;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TicketController extends Controller
{
    public function index()
    {
        $tickets = TicketSupport::where('utilisateur_id', auth()->id())
            ->latest()
            ->get();

        return Inertia::render('support/index', [
            'tickets' => $tickets,
        ]);
    }

    public function show(TicketSupport $ticket)
    {
        $ticket->load(['messages.utilisateur']);

        return Inertia::render('support/show', [
            'ticket' => $ticket,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sujet' => 'required|string|max:255',
            'description' => 'required|string',
            'priorite' => 'nullable|in:basse,normale,haute,urgente',
        ]);

        TicketSupport::create([
            ...$validated,
            'organisation_id' => auth()->user()->organisation_id,
            'utilisateur_id' => auth()->id(),
            'statut' => 'ouvert',
        ]);

        return redirect()->back()->with('success', 'Ticket créé avec succès.');
    }

    public function reply(Request $request, TicketSupport $ticket)
    {
        $validated = $request->validate([
            'message' => 'required|string',
        ]);

        MessageTicket::create([
            'ticket_id' => $ticket->id,
            'utilisateur_id' => auth()->id(),
            'message' => $validated['message'],
            'est_interne' => false,
        ]);

        // Remettre le ticket comme non-vu pour le superadmin
        $ticket->update(['vu_superadmin' => false]);

        return redirect()->back()->with('success', 'Réponse envoyée.');
    }
}
