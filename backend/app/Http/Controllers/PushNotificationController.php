<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\PushSubscription;
use App\Models\User;

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
    
    /**
     * Notify a student that a PC is available
     *
     * @param  string  $studentId
     * @param  string  $pcName
     * @return bool
     */
    public function notifyPcAvailable($studentId, $pcName)
    {
        try {
            Log::info("Attempting to send notification to student ID: {$studentId} for PC: {$pcName}");
            
            // Find the user by student ID
            $user = User::where('student_id', $studentId)->first();
            
            if (!$user) {
                Log::error("User not found for student ID: {$studentId}");
                return false;
            }
            
            // Find all subscriptions for this user
            $subscriptions = PushSubscription::where('user_id', $user->id)->get();
            
            if ($subscriptions->isEmpty()) {
                Log::warning("No push subscriptions found for user ID: {$user->id}");
                return false;
            }
            
            $successCount = 0;
            
            // Send notification to each subscription
            foreach ($subscriptions as $subscription) {
                $result = $this->sendPushNotification(
                    $subscription,
                    "YOUR PC IS READY NOW!",
                    "⚡ URGENT: PC {$pcName} is assigned to you! You must check in within 5 minutes or you'll lose your turn!",
                    [
                        'url' => '/student-portal',
                        'pcName' => $pcName,
                        'timestamp' => time()
                    ]
                );
                
                if ($result) {
                    $successCount++;
                }
            }
            
            if ($successCount > 0) {
                Log::info("Successfully sent {$successCount} notifications to student ID: {$studentId}");
                return true;
            } else {
                Log::warning("Failed to send any notifications to student ID: {$studentId}");
                return false;
            }
        } catch (\Exception $e) {
            Log::error("Error sending PC available notification: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
            return false;
        }
    }

    public function notifyStudentIsNext($studentId)
    {
        try {
            Log::info("Attempting to send 'You are next' notification to student ID: {$studentId}");
            
            $user = User::where('student_id', $studentId)->first();
            
            if (!$user) {
                Log::error("User not found for student ID: {$studentId}");
                return false;
            }
            
            $subscriptions = PushSubscription::where('user_id', $user->id)->get();
            
            if ($subscriptions->isEmpty()) {
                Log::warning("No push subscriptions found for user ID: {$user->id}");
                return false;
            }
            
            $successCount = 0;
            
            foreach ($subscriptions as $subscription) {
                $result = $this->sendPushNotification(
                    $subscription,
                    "🔔 You're Next in Line!",
                    "Get ready! The person ahead of you has been assigned a PC. Your turn is coming up soon.",
                    [
                        'url' => '/student-portal',
                        'timestamp' => time(),
                        'type' => 'you_are_next' // <-- ADDED THIS TYPE
                    ]
                );
                
                if ($result) {
                    $successCount++;
                }
            }
            
            if ($successCount > 0) {
                Log::info("Successfully sent {$successCount} 'you are next' notifications to student ID: {$studentId}");
                return true;
            } else {
                Log::warning("Failed to send any 'you are next' notifications to student ID: {$studentId}");
                return false;
            }
        } catch (\Exception $e) {
            Log::error("Error sending 'you are next' notification: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
            return false;
        }
    }
    
    /**
     * Send a push notification to a subscription
     *
     * @param  PushSubscription  $subscription
     * @param  string  $title
     * @param  string  $body
     * @param  array  $data
     * @return bool
     */
    private function sendPushNotification($subscription, $title, $body, $data = [])
    {
        try {
            // Log the notification attempt
            Log::info("Sending push notification to endpoint: {$subscription->endpoint}");
            
            // Add timestamp to ensure uniqueness
            $timestamp = time();
            
            // Create the notification payload with enhanced options and stronger alerts
            $payload = json_encode([
                'notification' => [
                    'title' => $title,
                    'body' => $body,
                    'icon' => '/favicon.ico',
                    'vibrate' => [200, 100, 200, 200, 200, 200, 200, 100, 200], 
                    'tag' => 'pc-notification-' . $timestamp,
                    'requireInteraction' => true,
                    'renotify' => true,
                    'silent' => false,
                    'timestamp' => $timestamp,
                    'actions' => [
                        [
                            'action' => 'open',
                            'title' => '⚡ Go to Portal Now!'
                        ]
                    ],
                    'badge' => '/favicon.ico',
                    'priority' => 'high'
                ],
                'data' => array_merge($data, [
                    'timestamp' => $timestamp,
                    'importance' => 'high',
                    'autoClose' => false
                ])
            ]);
            
            // Get the VAPID keys
            $vapidPublicKey = config('services.webpush.vapid.public_key');
            $vapidPrivateKey = config('services.webpush.vapid.private_key');
            $vapidSubject = config('services.webpush.vapid.subject', 'mailto:admin@example.com');
            
            if (empty($vapidPublicKey) || empty($vapidPrivateKey)) {
                Log::error("VAPID keys not configured");
                return false;
            }
            
            // For debugging purposes, log that we're attempting to send
            Log::info("Notification payload: " . $payload);
            
            // Create the WebPush client with improved options
            $webPush = new \Minishlink\WebPush\WebPush([
                'VAPID' => [
                    'subject' => $vapidSubject,
                    'publicKey' => $vapidPublicKey,
                    'privateKey' => $vapidPrivateKey,
                ],
                'TTL' => 86400, // 24 hours - keep trying to deliver for a day
                'urgency' => 'high', // Set high urgency
                'topic' => 'pc-available-' . $timestamp, // Unique topic
            ]);
            
            // Create subscription array for WebPush
            $webPushSubscription = \Minishlink\WebPush\Subscription::create([
                'endpoint' => $subscription->endpoint,
                'keys' => [
                    'p256dh' => $subscription->public_key,
                    'auth' => $subscription->auth_token,
                ],
            ]);
            
            // Send the notification
            $report = $webPush->sendOneNotification(
                $webPushSubscription,
                $payload,
                ['TTL' => 5000]
            );
            
            // Check if the notification was sent successfully
            $success = $report->isSuccess();
            $statusCode = $report->getResponse() ? $report->getResponse()->getStatusCode() : 'unknown';
            $reason = $report->getReason() ?: 'no reason provided';
            
            if ($success) {
                Log::info("Push notification sent successfully with status code: {$statusCode}");
            } else {
                Log::error("Failed to send push notification. Status code: {$statusCode}, Reason: {$reason}");
            }
            
            return $success;
        } catch (\Exception $e) {
            Log::error("Error sending push notification: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
            return false;
        }
    }
}