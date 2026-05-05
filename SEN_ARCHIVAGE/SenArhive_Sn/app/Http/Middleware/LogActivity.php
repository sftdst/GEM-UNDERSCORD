<?php

namespace App\Http\Middleware;

use App\Services\AuditService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogActivity
{
    public function __construct(protected AuditService $auditService) {}

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($request->user() && in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            $action = match ($request->method()) {
                'POST' => 'creation',
                'PUT', 'PATCH' => 'modification',
                'DELETE' => 'suppression',
                default => 'action',
            };

            $route = $request->route();
            $resourceType = null;
            $resourceId = null;

            if ($route) {
                $params = $route->parameters();
                foreach ($params as $key => $value) {
                    if (is_object($value) && method_exists($value, 'getKey')) {
                        $resourceType = class_basename($value);
                        $resourceId = $value->getKey();
                        break;
                    } elseif (is_string($value)) {
                        $resourceType = $key;
                        $resourceId = $value;
                    }
                }
            }

            if ($resourceType) {
                $this->auditService->log(
                    $action,
                    $resourceType,
                    $resourceId,
                    ['route' => $request->path(), 'method' => $request->method()]
                );
            }
        }

        return $response;
    }
}
