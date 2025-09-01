<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],

    'allowed_origins_patterns' => [
        '#https://[a-z0-9-]+\.ngrok-free\.app#',
        '#https://[a-z0-9-]+\.ngrok\.io#',
        '#http://192\.168\.\d+\.\d+:5173#',
        '#http://10\.\d+\.\d+\.\d+:5173#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
