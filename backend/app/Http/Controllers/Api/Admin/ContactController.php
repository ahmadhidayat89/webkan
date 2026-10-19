<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactSubmission;
use App\Models\Setting;
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
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'regex:/^[^\s?&=]+@[^\s?&=]+$/'],
            'phone' => ['nullable', 'string', 'max:20', 'regex:/^[0-9+\-\s()]*$/'],
            'subject' => ['required', 'string', 'max:200'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        // Buang baris baru dari field yang dipakai di header email
        foreach (['name', 'subject'] as $field) {
            $validated[$field] = trim(preg_replace('/[\r\n]+/', ' ', $validated[$field]));
        }

        // Pesan disimpan dulu, supaya tidak hilang walau email gagal
        ContactSubmission::create($validated);

        try {
            $adminEmail = Setting::get('contact_inbox_email') ?: config('mail.to_address');

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
                    ->from(config('mail.from.address'), config('mail.from.name'))
                    ->replyTo($validated['email'], $validated['name']);
            });
        } catch (\Throwable $e) {
            // Email gagal tidak membatalkan pesan yang sudah tersimpan
            Log::error('Contact notification email failed', [
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Your message has been sent successfully. We will get back to you soon!',
        ]);
    }
}
