<?php

use App\Http\Middleware\AccountAccess;
use App\Http\Middleware\PrivateApi;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Reader\Exception as SpreadsheetException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(web: __DIR__.'/../routes/web.php', api: __DIR__.'/../routes/api.php', commands: __DIR__.'/../routes/console.php', health: '/up')
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias(['role' => RoleMiddleware::class, 'account' => AccountAccess::class]);
        $middleware->appendToGroup('api', PrivateApi::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*'));
        $exceptions->render(function (QueryException $exception, Request $request) {
            if ($request->is('api/*') && (int) ($exception->errorInfo[1] ?? 0) === 1062) {
                return response()->json(['message' => 'Data berubah atau identitas permintaan sudah digunakan. Muat ulang dan periksa hasil sebelumnya.'], 409);
            }
            if ($request->is('api/*') && (int) ($exception->errorInfo[1] ?? 0) === 1451) {
                return response()->json(['message' => 'Data masih memiliki riwayat terkait dan tidak dapat dihapus.'], 409);
            }
            return null;
        });
        $exceptions->render(function (SpreadsheetException $exception, Request $request) {
            return $request->is('api/*') ? response()->json(['message' => 'Workbook tidak dapat dibaca. Gunakan template XLSX/CSV yang benar.'], 422) : null;
        });
    })->create();