<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Chemin vers le dossier laravel_app (un niveau au-dessus de www/)
// Structure LWS :
//   /home/[user]/laravel_app/   ← code Laravel
//   /home/[user]/www/           ← web root (ce fichier)
$appPath = __DIR__ . '/../laravel_app';

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = $appPath . '/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require $appPath . '/vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once $appPath . '/bootstrap/app.php';

$app->handleRequest(Request::capture());
