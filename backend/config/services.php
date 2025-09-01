<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'webpush' => [
        'vapid' => [
            'public_key' => env('VAPID_PUBLIC_KEY', 'BPYcFH-C_YNQkP4saQFRJ_zdTRjQ0xVLxuN4hQuogMjQJ8HSi6KZOb0W3-r5BHALSMgGWpv7BKwy7F6gtmxVxFc'),
            'private_key' => env('VAPID_PRIVATE_KEY', 'HQk2PuR-QRXcdm-lz3GezSX_LM1U0mp-G4JPkGQqDGw'),
            'subject' => env('VAPID_SUBJECT', 'mailto:admin@example.com')
        ]
    ],

];
