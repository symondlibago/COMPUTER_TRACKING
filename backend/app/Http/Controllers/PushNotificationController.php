<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\PushSubscription;

class PushNotificationController extends Controller
{
    /**
     * Get the VAPID public key for push notifications
     *
     * @return \Illuminate\Http\Response
     */
    public function getVapidPublicKey()
    {
        // Return the VAPID public key without requiring authentication
        return response()->json([
            'vapidPublicKey' => config('services.webpush.vapid.public_key')
        ])->header('Access-Control-Allow-Origin', '*')
          ->header('Access-Control-Allow-Methods', 'GET')
          ->header('Access-Control-Allow-Headers', 'Content-Type');
    }

    /**
     * Store a new push subscription
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function subscribe(Request $request)
    {
        $this->validate($request, [
            'endpoint' => 'required|string',
            'keys.auth' => 'required|string',
            'keys.p256dh' => 'required|string',
        ]);

        $user = Auth::user();
        
        // Delete any existing subscriptions for this user
        PushSubscription::where('user_id', $user->id)->delete();
        
        // Create new subscription
        $subscription = new PushSubscription([
            'user_id' => $user->id,
            'endpoint' => $request->endpoint,
            'public_key' => $request->keys['p256dh'],
            'auth_token' => $request->keys['auth'],
        ]);
        
        $subscription->save();
        
        return response()->json(['success' => true]);
    }

    /**
     * Remove a push subscription
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function unsubscribe(Request $request)
    {
        $this->validate($request, [
            'endpoint' => 'required|string',
        ]);

        $user = Auth::user();
        
        PushSubscription::where('user_id', $user->id)
            ->where('endpoint', $request->endpoint)
            ->delete();
        
        return response()->json(['success' => true]);
    }
}