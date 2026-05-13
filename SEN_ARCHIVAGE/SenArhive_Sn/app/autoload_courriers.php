<?php

/**
 * Fallback autoloader for new Courrier models
 * Registered after composer autoloader fails
 */

$splAutoload = function ($class) {
    $prefix = 'App\\';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) === 0) {
        $relative = substr($class, $len);
        $paths = [
            __DIR__ . '/app/Models/' . str_replace('\\', '/', $relative) . '.php',
            __DIR__ . '/app/' . str_replace('\\', '/', $relative) . '.php',
        ];
        foreach ($paths as $path) {
            if (file_exists($path)) {
                require $path;
                return;
            }
        }
    }
};

if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    // Register fallback before composer autoloader
    spl_autoload_register($splAutoload, true, true);
    require __DIR__ . '/vendor/autoload.php';
} else {
    echo "[ERROR] vendor/autoload.php not found. Run: composer install\n";
}