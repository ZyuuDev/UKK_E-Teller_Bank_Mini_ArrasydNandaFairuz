<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\User;
use App\Services\CustomerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PhpParser\Node\Expr\FuncCall;

class CustomerController extends Controller
{
    protected $customerService;
    public function __construct(CustomerService $customerService)
    {
        $this->customerService = $customerService;
    }

    //GET /api/admin/customers
    public function index()
    {
        $customers = Customer::with('user:id,username,name')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data'   => $customers,
        ], 200);
    }
    /*
     * POST /api/admin/customers
     * Body: {
     *   "nis": "12345",
     *   "full_name": "Ahmad Siswa",
     *   "class_name": "XII RPL 1",
     *   "security_pin": "123456",
     *   "username": "ahmad_siswa",    ← untuk akun login Nasabah
     *   "password": "password123"     ← password akun login
     * }
     */

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nis'          => 'required|string|max:20|unique:customers,nis',
            'full_name'    => 'required|string|max:100',
            'class_name'   => 'required|string|max:20',
            'security_pin' => 'required|digits:6',
            'username'     => 'required|string|max:50|unique:users,username',
            'password'     => 'required|string|min:6',
        ]);

        $customer = DB::transaction(function () use ($validated) {
            $user = User::create([
                'username' => $validated['username'],
                'password' => $validated['password'],
                'name'     => $validated['full_name'],
                'role'     => 'Nasabah',
            ]);

            $accountNumber = $this->customerService->generateAccountNumber();
            $qrToken = $this->customerService->generateQrToken();

            $customer = Customer::create([
                'user_id'        => $user->id,
                'account_number' => $accountNumber,
                'nis'            => $validated['nis'],
                'full_name'      => $validated['full_name'],
                'class_name'     => $validated['class_name'],
                'balance'        => 0, // saldo awal = Rp 0
                'security_pin'   => $validated['security_pin'], // otomatis di-hash oleh cast
                'qr_code_token'  => $qrToken,
            ]);
            return $customer;
        });
        $customer->load('user:id,username,name,role');

        return response()->json([
            'status'  => 'success',
            'message' => 'Rekening nasabah berhasil dibuat.',
            'data'    => [
                'customer'       => $customer,
                'account_number' => $customer->account_number,
                'qr_code_token'  => $customer->qr_code_token,
            ],
        ], 201);
    }

    public function show(string $id)
    {
        $customer = Customer::with('user:id,username,name,role')->find($id);
        if (!$customer) {
            return response()->json([
                'status' => 'error',
                'message'=> 'Nasabah tidak ditemukan',
            ], 404);
        }
        return response()->json([
            'status' => 'success',
            'data'   => $customer,
        ], 200);
    }

    /**
     * Method: PUT/PATCH
     * URL: /api/admin/customers/{id}
     * Body: { "full_name": "...", "class_name": "...", "security_pin": "..." }
     * Catatan: account_number dan qr_code_token TIDAK BOLEH diubah manual
     */

    public function update(Request $request, string $id)
    {
        // 1. Cari nasabah
        $customer = Customer::find($id);
        if (!$customer) {
            return response()->json([
                'status' => 'error',
                'message'=> 'Nasabah tidak ditemukan',
            ], 404);
        }

        // 2. Validasi
        $validated = $request->validate([
            'nis'          => 'sometimes|string|max:20|unique:customers,nis,' . $id,
            'full_name'    => 'sometimes|string|max:100',
            'class_name'   => 'sometimes|string|max:20',
            'security_pin' => 'sometimes|digits:6',
        ]);

        // 4. update
        $customer->update($validated);
        if (isset($validated['full_name']) && $customer->user) {
            $customer->user->update(['name' => $validated['full_name']]);
        }

        // 5. respon sukses
        return response()->json([
            'status'  => 'success',
            'message' => 'Data nasabah berhasil diperbarui.',
            'data'    => $customer->load('user:id,username,name,role'),
        ], 200);
    }
    
}