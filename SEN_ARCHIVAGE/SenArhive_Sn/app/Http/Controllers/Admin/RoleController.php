<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function index()
    {
        $roles = Role::withCount('utilisateurs')->get();

        return Inertia::render('admin/roles/index', [
            'roles' => $roles,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string',
            'permissions' => 'nullable|array',
        ]);

        Role::create([
            ...$validated,
            'organisation_id' => auth()->user()->organisation_id,
            'est_systeme' => false,
        ]);

        return redirect()->back()->with('success', 'Rôle créé avec succès.');
    }

    public function update(Request $request, Role $role)
    {
        if ($role->est_systeme) {
            return redirect()->back()->withErrors(['error' => 'Les rôles système ne peuvent pas être modifiés.']);
        }

        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'permissions' => 'nullable|array',
        ]);

        $role->update($validated);

        return redirect()->back()->with('success', 'Rôle mis à jour.');
    }

    public function destroy(Role $role)
    {
        if ($role->est_systeme) {
            return redirect()->back()->withErrors(['error' => 'Les rôles système ne peuvent pas être supprimés.']);
        }

        $role->delete();

        return redirect()->back()->with('success', 'Rôle supprimé.');
    }
}
