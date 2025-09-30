<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [
        '#^https://[a-z0-9-]+\.ngrok-free\.app$#',
        '#^https://[a-z0-9-]+\.ngrok\.io$#',
        '#^http://192\.168\.\d+\.\d+:5173$#',
        '#^http://10\.\d+\.\d+\.\d+:5173$#',
    ],

    // 'allowed_origins'  => [
    //     'https://computer-tracking.vercel.app'
    // ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
