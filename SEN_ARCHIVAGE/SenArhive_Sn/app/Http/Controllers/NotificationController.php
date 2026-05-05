<?php

namespace App\Http\Controllers;

use App\Models\NotificationCustom;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class NotificationController extends Controller
{
    public function index(): JsonResponse
    {
        if (!Schema::hasTable('notifications_custom')) {
            return response()->json([]);
        }

        $notifications = NotificationCustom::where('utilisateur_id', auth()->id())
            ->where('lu', false)
            ->with(['acteur:id,nom,prenom,avatar_url'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($notifications);
    }

    public function markAsRead(NotificationCustom $notification): JsonResponse
    {
        if (!Schema::hasTable('notifications_custom')) {
            return response()->json(['success' => false]);
        }

        $notification->marquerCommeLu();

        return response()->json(['success' => true]);
    }

    public function markAllAsRead(): JsonResponse
    {
        if (!Schema::hasTable('notifications_custom')) {
            return response()->json(['success' => false]);
        }

        NotificationCustom::where('utilisateur_id', auth()->id())
            ->where('lu', false)
            ->update([
                'lu' => true,
                'lu_le' => now(),
            ]);

        return response()->json(['success' => true]);
    }
}
