<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\StudentImportService;
use Illuminate\Http\Request;

class StudentImportController extends Controller
{
    public function preview(Request $request, StudentImportService $imports)
    {
        $request->validate(['file' => 'required|file|max:5120|extensions:xlsx,csv']);
        return response()->json(['data' => $imports->preview($request->file('file'), $request->user()->id)], 201);
    }

    public function commit(Request $request, string $id, StudentImportService $imports)
    {
        return response()->json(['data' => $imports->commit($id, $request->user()->id)]);
    }

    public function template()
    {
        return response()->streamDownload(function () {
            $stream = fopen('php://output', 'wb');
            fwrite($stream, "\xEF\xBB\xBF");
            fputcsv($stream, ['student_number', 'full_name', 'graduation_year'], ',', '"', '');
            fclose($stream);
        }, 'student-import-template.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}