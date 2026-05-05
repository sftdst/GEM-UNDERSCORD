<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Chemin vers le dossier Laravel (hors public_html)
// Sur LWS : /home/votre-login/senarchive/
$laravelRoot = __DIR__ . '/senarchive';

// Maintenance mode
if (file_exists($maintenance = $laravelRoot . '/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Composer autoloader
require $laravelRoot . '/vendor/autoload.php';

// Bootstrap Laravel
/** @var Application $app */
$app = require_once $laravelRoot . '/bootstrap/app.php';

$app->handleRequest(Request::capture());
