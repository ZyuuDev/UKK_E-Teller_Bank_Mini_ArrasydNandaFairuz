<?php

namespace App\Http\Controllers;

use App\Models\Saver;
use App\Models\WithdrawalAppointment;
use App\Services\AuditService;
use App\Services\BankingService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class WithdrawalAppointmentController extends Controller
{
    private function generateCode(): string
    {
        do {
            $code = 'JANJI-' . now()->format('ymd') . '-' . strtoupper(Str::random(4));
        } while (WithdrawalAppointment::where('appointment_code', $code)->exists());

        return $code;
    }

    public function studentIndex(Request $request)
    {
        $saver = $request->user()->member?->saver;
        abort_unless($saver, 404, 'Rekening penabung tidak ditemukan.');

        $appointments = WithdrawalAppointment::where('saver_id', $saver->id)
            ->latest()
            ->paginate(15);

        return response()->json($appointments);
    }

    public function studentLimits(Request $request, BankingService $bank)
    {
        $saver = $request->user()->member?->saver;
        abort_unless($saver, 404, 'Rekening penabung tidak ditemukan.');

        return response()->json([
            'data' => $bank->getWithdrawalLimits($saver),
        ]);
    }

    public function studentStore(Request $request)
    {
        $saver = $request->user()->member?->saver;
        abort_unless($saver && $request->user()->member?->account_status === 'active', 403, 'Rekening Anda belum aktif.');

        $minThreshold = (int) config('bank.appointment_threshold', 1000000);
        $minimumBalance = (int) config('bank.minimum_balance', 10000);

        $data = $request->validate([
            'amount' => ['required', 'integer', "min:" . ($minThreshold + 1)],
            'scheduled_date' => ['required', 'date', 'after:today'],
            'notes' => ['nullable', 'string', 'max:255'],
        ], [
            'amount.min' => 'Perjanjian penarikan kas hanya untuk nominal di atas Rp1.000.000.',
            'scheduled_date.after' => 'Perjanjian penarikan kas wajib diajukan minimal H-1 (mulai besok).',
        ]);

        if ($saver->balance - $data['amount'] < $minimumBalance) {
            throw ValidationException::withMessages([
                'amount' => 'Saldo Anda tidak mencukupi untuk penarikan ini dengan tetap menyisakan saldo minimal Rp10.000.',
            ]);
        }

        $appointment = WithdrawalAppointment::create([
            'appointment_code' => $this->generateCode(),
            'saver_id' => $saver->id,
            'amount' => $data['amount'],
            'scheduled_date' => $data['scheduled_date'],
            'notes' => $data['notes'] ?? null,
            'status' => 'pending',
            'created_by' => $request->user()->id,
            'creator_role' => 'student',
        ]);

        return response()->json([
            'message' => 'Pengajuan perjanjian penarikan berhasil dibuat dan menunggu persetujuan Admin.',
            'data' => $appointment,
        ], 201);
    }

    public function tellerIndex(Request $request)
    {
        $query = WithdrawalAppointment::with(['saver.member.user', 'approver', 'creator'])->latest();

        if ($request->filled('q')) {
            $search = $request->q;
            $query->where(function ($q) use ($search) {
                $q->where('appointment_code', 'like', "%{$search}%")
                    ->orWhereHas('saver', function ($sq) use ($search) {
                        $sq->where('account_number', 'like', "%{$search}%")
                            ->orWhereHas('member', function ($mq) use ($search) {
                                $mq->where('full_name', 'like', "%{$search}%")
                                    ->orWhere('student_number', 'like', "%{$search}%");
                            });
                    });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date')) {
            $query->whereDate('scheduled_date', $request->date);
        }

        return response()->json($query->paginate(20));
    }

    public function tellerStore(Request $request)
    {
        $minThreshold = (int) config('bank.appointment_threshold', 1000000);
        $minimumBalance = (int) config('bank.minimum_balance', 10000);

        $data = $request->validate([
            'account_number' => ['required', 'string', 'exists:savers,account_number'],
            'amount' => ['required', 'integer', "min:" . ($minThreshold + 1)],
            'scheduled_date' => ['required', 'date', 'after:today'],
            'notes' => ['nullable', 'string', 'max:255'],
        ], [
            'amount.min' => 'Perjanjian penarikan kas hanya untuk nominal di atas Rp1.000.000.',
            'scheduled_date.after' => 'Perjanjian penarikan kas wajib diajukan minimal H-1 (mulai besok).',
        ]);

        $saver = Saver::with('member')->where('account_number', $data['account_number'])->firstOrFail();
        if ($saver->member?->account_status !== 'active') {
            throw ValidationException::withMessages([
                'account_number' => 'Rekening nasabah ini sedang tidak aktif.',
            ]);
        }

        if ($saver->balance - $data['amount'] < $minimumBalance) {
            throw ValidationException::withMessages([
                'amount' => 'Saldo nasabah tidak mencukupi untuk penarikan ini dengan tetap menyisakan saldo minimal Rp10.000.',
            ]);
        }

        $appointment = WithdrawalAppointment::create([
            'appointment_code' => $this->generateCode(),
            'saver_id' => $saver->id,
            'amount' => $data['amount'],
            'scheduled_date' => $data['scheduled_date'],
            'notes' => $data['notes'] ?? null,
            'status' => 'pending',
            'created_by' => $request->user()->id,
            'creator_role' => 'teller',
        ]);

        return response()->json([
            'message' => 'Pengajuan perjanjian penarikan berhasil dicatat oleh Teller dan menunggu persetujuan Admin.',
            'data' => $appointment,
        ], 201);
    }

    public function adminIndex(Request $request)
    {
        $query = WithdrawalAppointment::with(['saver.member.user', 'approver', 'creator'])->latest();

        if ($request->filled('q')) {
            $search = $request->q;
            $query->where(function ($q) use ($search) {
                $q->where('appointment_code', 'like', "%{$search}%")
                    ->orWhereHas('saver', function ($sq) use ($search) {
                        $sq->where('account_number', 'like', "%{$search}%")
                            ->orWhereHas('member', function ($mq) use ($search) {
                                $mq->where('full_name', 'like', "%{$search}%")
                                    ->orWhere('student_number', 'like', "%{$search}%");
                            });
                    });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date')) {
            $query->whereDate('scheduled_date', $request->date);
        }

        return response()->json($query->paginate(20));
    }

    public function adminApprove(Request $request, WithdrawalAppointment $appointment, AuditService $audit)
    {
        if ($appointment->status !== 'pending') {
            abort(422, 'Hanya permohonan berstatus Menunggu (Pending) yang dapat disetujui.');
        }

        $appointment->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'rejection_reason' => null,
        ]);

        $audit->record($request->user()->id, 'appointment.approved', 'withdrawal_appointment', $appointment->id, [
            'code' => $appointment->appointment_code,
            'amount' => $appointment->amount,
            'date' => $appointment->scheduled_date->toDateString(),
        ]);

        return response()->json([
            'message' => "Perjanjian penarikan {$appointment->appointment_code} berhasil disetujui.",
            'data' => $appointment->fresh(['saver.member.user', 'approver', 'creator']),
        ]);
    }

    public function adminReject(Request $request, WithdrawalAppointment $appointment, AuditService $audit)
    {
        if ($appointment->status !== 'pending') {
            abort(422, 'Hanya permohonan berstatus Menunggu (Pending) yang dapat ditolak.');
        }

        $data = $request->validate([
            'reason' => ['required', 'string', 'max:255'],
        ], [
            'reason.required' => 'Alasan penolakan wajib diisi.',
        ]);

        $appointment->update([
            'status' => 'rejected',
            'rejection_reason' => $data['reason'],
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        $audit->record($request->user()->id, 'appointment.rejected', 'withdrawal_appointment', $appointment->id, [
            'code' => $appointment->appointment_code,
            'reason' => $data['reason'],
        ]);

        return response()->json([
            'message' => "Perjanjian penarikan {$appointment->appointment_code} telah ditolak.",
            'data' => $appointment->fresh(['saver.member.user', 'approver', 'creator']),
        ]);
    }
}

