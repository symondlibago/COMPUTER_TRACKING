<?php

require __DIR__ . '/vendor/autoload.php';

use Minishlink\WebPush\VAPID;

// Generate VAPID keys
$vapidKeys = VAPID::createVapidKeys();

// Output the keys
echo "VAPID_PUBLIC_KEY=" . $vapidKeys['publicKey'] . "\n";
echo "VAPID_PRIVATE_KEY=" . $vapidKeys['privateKey'] . "\n";

// Instructions
echo "\n";
echo "Add these keys to your .env file\n";