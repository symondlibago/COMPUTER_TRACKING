<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PushSubscription;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class PushNotificationController extends Controller
{
    /**
     * Store a new push notification subscription.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function subscribe(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|string',
            'keys.auth' => 'required|string',
            'keys.p256dh' => 'required|string',
            'student_id' => 'required|string',
        ]);

        try {
            // Store subscription in database
            PushSubscription::updateOrCreate(
                ['endpoint' => $request->endpoint],
                [
                    'student_id' => $request->student_id,
                    'auth_token' => $request->keys['auth'],
                    'public_key' => $request->keys['p256dh'],
                ]
            );

            return response()->json(['success' => true, 'message' => 'Subscription saved successfully']);
        } catch (\Exception $e) {
            Log::error('Push subscription error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to save subscription'], 500);
        }
    }

    /**
     * Unsubscribe from push notifications.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function unsubscribe(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|string',
        ]);

        try {
            PushSubscription::where('endpoint', $request->endpoint)->delete();
            return response()->json(['success' => true, 'message' => 'Subscription removed successfully']);
        } catch (\Exception $e) {
            Log::error('Push unsubscription error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to remove subscription'], 500);
        }
    }

    /**
     * Send notification to a specific student.
     *
     * @param  string  $studentId
     * @param  string  $title
     * @param  string  $body
     * @param  string  $url
     * @return bool
     */
    public function sendNotificationToStudent($studentId, $title, $body, $url = null)
    {
        try {
            $subscriptions = PushSubscription::where('student_id', $studentId)->get();
            
            if ($subscriptions->isEmpty()) {
                Log::info("No push subscriptions found for student ID: {$studentId}");
                return false;
            }

            $auth = [
                'VAPID' => [
                    'subject' => env('VAPID_SUBJECT', env('APP_URL')),
                    'publicKey' => env('VAPID_PUBLIC_KEY'),
                    'privateKey' => env('VAPID_PRIVATE_KEY'),
                ],
            ];

            $webPush = new WebPush($auth);
            $payload = json_encode([
                'title' => $title,
                'body' => $body,
                'url' => $url,
            ]);

            foreach ($subscriptions as $subscription) {
                $webPush->queueNotification(
                    Subscription::create([
                        'endpoint' => $subscription->endpoint,
                        'keys' => [
                            'p256dh' => $subscription->public_key,
                            'auth' => $subscription->auth_token,
                        ],
                    ]),
                    $payload
                );
            }

            $webPush->flush();
            return true;
        } catch (\Exception $e) {
            Log::error('Send notification error: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Notify student when a PC becomes available for them.
     *
     * @param  string  $studentId
     * @param  string  $pcName
     * @return bool
     */
    public function notifyPcAvailable($studentId, $pcName)
    {
        $title = 'PC Available!';
        $body = "PC {$pcName} is now available for you. Please check in within 5 minutes.";
        $url = env('APP_URL') . '/student-portal';
        
        return $this->sendNotificationToStudent($studentId, $title, $body, $url);
    }
}