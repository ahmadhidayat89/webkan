<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class ContactController extends Controller
{
    /**
     * Handle contact form submission
     */
    public function submit(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        try {
            // Send email notification to admin
            $adminEmail = env('MAIL_TO_ADDRESS', 'info@kan.go.id');
            
            Mail::send('emails.contact', [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? '-',
                'subject' => $validated['subject'],
                'messageContent' => $validated['message'],
                'submittedAt' => now()->format('d F Y, H:i'),
            ], function ($message) use ($validated, $adminEmail) {
                $message->to($adminEmail)
                        ->subject('New Contact Form Submission: ' . $validated['subject'])
                        ->from(config('mail.from.address'), config('mail.from.name'));
            });

            // Optional: Store in database for records
            // ContactSubmission::create($validated);

            // Log the submission
            Log::info('Contact form submitted', [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'subject' => $validated['subject'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Your message has been sent successfully. We will get back to you soon!',
            ]);

        } catch (\Exception $e) {
            Log::error('Contact form submission failed', [
                'error' => $e->getMessage(),
                'data' => $validated,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send message. Please try again later or contact us directly.',
            ], 500);
        }
    }

    /**
     * Test email configuration
     */
    public function testEmail()
    {
        try {
            Mail::raw('This is a test email from KAN website.', function ($message) {
                $message->to(env('MAIL_TO_ADDRESS', 'info@kan.go.id'))
                        ->subject('KAN Website - Test Email')
                        ->from(config('mail.from.address'), config('mail.from.name'));
            });

            return response()->json([
                'success' => true,
                'message' => 'Test email sent successfully!',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send test email: ' . $e->getMessage(),
            ], 500);
        }
    }
}
