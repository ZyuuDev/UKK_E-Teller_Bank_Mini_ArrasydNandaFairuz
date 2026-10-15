<?php

namespace App\Http\Controllers\Teller;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\Saver;
use App\Models\Transaction;
use App\Services\BankingService;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function search(Request $request)
    {
        $data = $request->validate(['q' => 'required|string|max:100']);
        $query = $data['q'];
        $saver = Saver::where('account_number', $query)->orWhere('qr_code_token', $query)->first();
        $member = $saver?->member ?? Member::where('student_number', $query)->first();
        abort_unless($member, 404, 'Anggota tidak ditemukan. Gunakan nomor siswa, nomor rekening, atau QR.');
        $saver = $saver ?? $member->saver;
        return response()->json(['data' => [
            'member' => $member->only(['user_id', 'student_number', 'full_name', 'graduation_year', 'account_status']),
            'saver' => $member->account_status === 'active' ? $saver?->profile() : null,
        ]]);
    }

    public function activate(Request $request, BankingService $bank)
    {
        $data = $request->validate([
            'member_id' => 'required|integer|exists:members,user_id',
            'amount' => 'required|integer|min:10000|max:1000000000000',
            'security_pin' => 'required|string|digits:6',
            'request_id' => 'required|uuid',
        ]);
        $transaction = $bank->activate((int) $data['member_id'], (int) $data['amount'], $data['security_pin'], $request->user()->id, $data['request_id']);
        return response()->json(['data' => $transaction->receipt()], 201);
    }

    public function deposit(Request $request, BankingService $bank)
    {
        return $this->perform($request, $bank, 'Deposit');
    }

    public function withdraw(Request $request, BankingService $bank)
    {
        return $this->perform($request, $bank, 'Withdrawal');
    }

    private function perform(Request $request, BankingService $bank, string $type)
    {
        $data = $request->validate([
            'account_number' => 'required|string|max:20',
            'amount' => 'required|integer|min:1|max:1000000000000',
            'security_pin' => $type === 'Withdrawal' ? 'required|string|digits:6' : 'nullable|string',
            'notes' => 'nullable|string|max:255',
            'request_id' => 'required|uuid',
        ]);
        $transaction = $bank->transact($data['account_number'], (int) $data['amount'], $type, $data['security_pin'] ?? null, $request->user()->id, $data['request_id'], $data['notes'] ?? null);
        return response()->json(['data' => $transaction->receipt()], 201);
    }

    public function receipt(Request $request, Transaction $transaction)
    {
        abort_unless($transaction->teller_id === $request->user()->id, 404);
        return response()->json(['data' => $transaction->receipt()]);
    }

    public function byRequest(Request $request, string $requestId)
    {
        $transaction = Transaction::where('request_id', $requestId)->where('teller_id', $request->user()->id)->firstOrFail();
        return response()->json(['data' => $transaction->receipt()]);
    }
}