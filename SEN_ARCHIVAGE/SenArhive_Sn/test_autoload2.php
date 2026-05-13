<?php

// Minimal test - test PSR-4 autoload directly
$vendorDir = __DIR__ . '/vendor';
$baseDir = __DIR__;

require_once $vendorDir . '/composer/ClassLoader.php';

$loader = new \Composer\Autoload\ClassLoader(\dirname($vendorDir));

// Load PSR-4 map from composer
$map = require $vendorDir . '/composer/autoload_psr4.php';
foreach ($map as $namespace => $paths) {
    foreach ((array)$paths as $path) {
        $loader->addPsr4($namespace, $path);
    }
}

// Load classmap if it exists
$classMapFile = $vendorDir . '/composer/autoload_classmap.php';
if (file_exists($classMapFile)) {
    $classMap = require $classMapFile;
    if (is_array($classMap)) {
        $loader->addClassMap($classMap);
    }
}

$loader->register(true);

echo "Testing autoload...\n";

// Test existing model
$doc = new App\Models\Document();
echo "Document loaded: " . get_class($doc) . "\n";

// Test new model
$statut = new App\Models\CourrierStatut();
echo "CourrierStatut loaded: " . get_class($statut) . "\n";

$type = new App\Models\CourrierType();
echo "CourrierType loaded: " . get_class($type) . "\n";

$courrier = new App\Models\Courrier();
echo "Courrier loaded: " . get_class($courrier) . "\n";

echo "All models loaded successfully!\n";