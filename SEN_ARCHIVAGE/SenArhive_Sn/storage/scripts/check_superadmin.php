<?php
require __DIR__ . '/../../vendor/autoload.php';
$app = require __DIR__ . '/../../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\SuperAdmin;

$exists = SuperAdmin::where('email', 'superadmin@senarchive.sn')->exists();
if ($exists) {
    echo "FOUND\n";
    $user = SuperAdmin::where('email', 'superadmin@senarchive.sn')->first();
    echo "ID:" . $user->id . " EMAIL:" . $user->email . "\n";
} else {
    echo "NOTFOUND\n";
}
