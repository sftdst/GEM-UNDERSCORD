<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrganisationController extends Controller
{
    public function index()
    {
        $organisation = auth()->user()->organisation()->with('plan')->first();

        return Inertia::render('admin/organisation/index', [
            'organisation' => $organisation,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:255',
            'slug' => 'sometimes|required|string|max:255|alpha_dash',
            'logo_url' => 'nullable|string|max:2048',
            'pays' => 'sometimes|required|string|max:100',
            'langue_defaut' => 'sometimes|required|string|max:10',
            'timezone' => 'sometimes|required|string|max:100',
        ]);

        $organisation = auth()->user()->organisation;
        $organisation->update($validated);

        return redirect()->back()->with('success', 'Organisation mise à jour.');
    }
}
