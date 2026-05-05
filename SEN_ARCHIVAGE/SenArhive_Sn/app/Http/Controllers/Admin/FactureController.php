<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Facture;
use Inertia\Inertia;

class FactureController extends Controller
{
    public function index()
    {
        $factures = Facture::where('organisation_id', auth()->user()->organisation_id)
            ->with('abonnement')
            ->latest('periode_debut')
            ->paginate(20);

        return Inertia::render('admin/billing/invoices', [
            'factures' => $factures,
        ]);
    }
}
