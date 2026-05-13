<?php

require __DIR__ . '/vendor/autoload.php';

echo "Autoloader works\n";

try {
    $c = new App\Models\CourrierStatut();
    echo "CourrierStatut loaded: OK\n";
} catch (Error $e) {
    echo "CourrierStatut FAILED: " . $e->getMessage() . "\n";
}

try {
    $t = new App\Models\CourrierType();
    echo "CourrierType loaded: OK\n";
} catch (Error $e) {
    echo "CourrierType FAILED: " . $e->getMessage() . "\n";
}

try {
    $doc = new App\Models\Courrier();
    echo "Courrier loaded: OK\n";
} catch (Error $e) {
    echo "Courrier FAILED: " . $e->getMessage() . "\n";
}

echo "Done\n";