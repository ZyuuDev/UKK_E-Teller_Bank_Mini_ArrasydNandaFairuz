<?php

namespace App\Services;

use App\Models\Customer;
use Illuminate\Support\Str;

class CustomerService
{
    /**
     * Generate nomor rekening otomatis
     * Format: BMS-{YYYY}-{4-digit-sequential}
     * Contoh: BMS-2026-0001, BMS-2026-0002
     */
    public function generateAccountNumber(): string
    {
        $year = date('Y');

        $prefix = 'BMS-' . $year . '-';

        $lastCustomer = Customer::where('account_number', 'like', $prefix . '%')
            ->orderBy('account_number', 'desc')
            ->first();

        if ($lastCustomer) {
            $lastNumber = (int) substr($lastCustomer->account_number, -4);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Token ini yang akan dijadikan isi QR Code kartu nasabah
     */
    public function generateQrToken(): string
    {
        do {
            $token = Str::uuid()->toString();
        } while (Customer::where('qr_code_token', $token)->exists());

        return $token;
    }
}