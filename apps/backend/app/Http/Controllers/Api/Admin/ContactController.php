<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContactMessageRequest;
use App\Mail\ContactReplyMail;
use App\Models\Contact;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    // Public: simpan pesan dari form kontak
    public function submit(StoreContactMessageRequest $request)
    {
        $payload = $request->cleanPayload();
        $spamScore = $request->spamScore();
        $spamReasons = $request->spamReasons();
        $isSpam = $request->isSpamFlagged();

        $duplicateWindowStart = Carbon::now()->subMinutes(10);
        $isDuplicate = Contact::query()
            ->where('email', $payload['email'])
            ->where('subject', $payload['subject'])
            ->where('message', $payload['message'])
            ->where('ip_address', $request->ip())
            ->where('created_at', '>=', $duplicateWindowStart)
            ->exists();

        if ($isDuplicate) {
            Log::warning('contact_submission_blocked', [
                'reason' => 'duplicate_submission',
                'ip' => $request->ip(),
                'email_hash' => sha1(strtolower((string) $payload['email'])),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Pengiriman berulang terdeteksi. Coba lagi beberapa menit lagi.',
            ], 429);
        }

        Contact::create([
            ...$payload,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'status' => $isSpam ? 'spam' : 'pending',
            'spam_score' => $spamScore,
            'spam_reason' => empty($spamReasons) ? null : implode(',', $spamReasons),
            'submitted_at' => now(),
        ]);

        if ($isSpam) {
            Log::info('contact_submission_flagged', [
                'ip' => $request->ip(),
                'email_hash' => sha1(strtolower((string) $payload['email'])),
                'spam_score' => $spamScore,
                'spam_reason' => $spamReasons,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Pesan Anda telah diterima. Kami akan segera menghubungi Anda.',
        ]);
    }

    // Admin: list semua pesan
    public function index(Request $request)
    {
        $query = Contact::latest();

        if ($request->filled('is_read')) {
            $query->where('is_read', filter_var($request->is_read, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%");
            });
        }

        $contacts = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $contacts,
            'unread' => Contact::where('is_read', false)->count(),
        ]);
    }

    // Admin: detail satu pesan (otomatis tandai terbaca)
    public function show($id)
    {
        $contact = Contact::findOrFail($id);
        $contact->update([
            'is_read' => true,
            'status' => $contact->status === 'pending' ? 'read' : $contact->status,
        ]);

        return response()->json([
            'success' => true,
            'data' => $contact,
        ]);
    }

    // Admin: tandai terbaca/belum
    public function toggleRead($id)
    {
        $contact = Contact::findOrFail($id);
        $nextReadState = !$contact->is_read;
        $nextStatus = $contact->status;

        if ($contact->status !== 'spam' && $contact->status !== 'replied') {
            $nextStatus = $nextReadState ? 'read' : 'pending';
        }

        $contact->update([
            'is_read' => $nextReadState,
            'status' => $nextStatus,
        ]);

        return response()->json([
            'success' => true,
            'data' => $contact,
        ]);
    }

    // Admin: kirim balasan email ke pengirim pesan via Gmail SMTP dari settings
    public function reply(Request $request, $id)
    {
        $contact = Contact::findOrFail($id);

        $validated = $request->validate([
            'message' => 'required|string|max:5000',
        ]);

        // Baca kredensial dari tabel settings
        $mailUsername = Setting::where('key', 'mail_username')->value('value_id');
        $mailPassword = Setting::where('key', 'mail_password')->value('value_id');
        $mailFromName = Setting::where('key', 'mail_from_name')->value('value_id') ?: 'Komite Akreditasi Nasional';

        if (empty($mailUsername) || empty($mailPassword)) {
            return response()->json([
                'success' => false,
                'message' => 'Konfigurasi email belum diisi. Silakan atur di halaman Settings -> Email Balasan.',
            ], 422);
        }

        // Override config mailer secara runtime
        config([
            'mail.mailers.smtp.host' => 'smtp.gmail.com',
            'mail.mailers.smtp.port' => 587,
            'mail.mailers.smtp.username' => $mailUsername,
            'mail.mailers.smtp.password' => $mailPassword,
            'mail.mailers.smtp.encryption' => 'tls',
            'mail.from.address' => $mailUsername,
            'mail.from.name' => $mailFromName,
        ]);

        try {
            Mail::mailer('smtp')->to($contact->email)->send(new ContactReplyMail(
                recipientName: $contact->name,
                replyBody: $validated['message'],
                originalMessage: $contact->message,
                originalSubject: $contact->subject,
            ));
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim email: ' . $e->getMessage(),
            ], 500);
        }

        $contact->update([
            'is_read' => true,
            'status' => $contact->status === 'spam' ? 'spam' : 'replied',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Balasan berhasil dikirim ke ' . $contact->email,
        ]);
    }

    // Admin: hapus pesan
    public function destroy($id)
    {
        Contact::findOrFail($id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pesan berhasil dihapus.',
        ]);
    }
}
