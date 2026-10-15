<?php

namespace App\Http\Controllers\Teller;

use App\Http\Controllers\Controller;
use App\Models\DailyReconciliation;
use App\Services\CashSessionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CashSessionController extends Controller
{
    public function index(Request $request, CashSessionService $sessions)
    {
        $rows = DB::table('cash_sessions')->where('teller_id', $request->user()->id)->orderByDesc('date')->limit(30)->get();
        return response()->json(['data' => $rows->map(fn ($session) => $sessions->summary($session))]);
    }

    public function store(Request $request, CashSessionService $sessions)
    {
        $data = $request->validate(['opening_balance' => 'required|integer|min:0|max:1000000000000']);
        return response()->json(['data' => $sessions->open($request->user()->id, (int) $data['opening_balance'])], 201);
    }

    public function submit(Request $request, int $session, CashSessionService $sessions)
    {
        $data = $request->validate(['actual_cash_on_hand' => 'required|integer|min:0|max:9000000000000']);
        return response()->json(['data' => $sessions->submit($session, $request->user()->id, (int) $data['actual_cash_on_hand'])], 201);
    }

    public function reports(Request $request)
    {
        return response()->json(['data' => DailyReconciliation::where('teller_id', $request->user()->id)->orderByDesc('date')->paginate(25)]);
    }
}