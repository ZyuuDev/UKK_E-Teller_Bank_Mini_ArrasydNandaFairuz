<?php

namespace App\Services;

use App\Models\Member;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx;
use ZipArchive;

class StudentImportService
{
    public function __construct(private MemberService $members, private AuditService $audit)
    {
    }

    private function fail(string $message): never
    {
        throw ValidationException::withMessages(['file' => $message]);
    }

    private function readRows(UploadedFile $file): array
    {
        $rows = [];
        $limit = config('bank.import_max_rows');
        if (strtolower($file->getClientOriginalExtension()) === 'csv') {
            $handle = fopen($file->getRealPath(), 'rb');
            try {
                $first = fgets($handle);
                if ($first === false) {
                    $this->fail('File kosong.');
                }
                $delimiter = substr_count($first, ';') > substr_count($first, ',') ? ';' : ',';
                rewind($handle);
                while (($row = fgetcsv($handle, 0, $delimiter, '"', '')) !== false) {
                    $rows[] = array_map(fn ($value) => trim((string) $value), $row);
                    if (count($rows) > $limit + 1) {
                        $this->fail('Jumlah siswa melebihi batas impor.');
                    }
                }
            } finally {
                fclose($handle);
            }
        } else {
            $zip = new ZipArchive();
            if ($zip->open($file->getRealPath()) !== true) {
                $this->fail('File XLSX tidak valid.');
            }
            try {
                $size = 0;
                if ($zip->numFiles > 2000) {
                    $this->fail('Struktur workbook terlalu besar.');
                }
                for ($index = 0; $index < $zip->numFiles; $index++) {
                    $size += $zip->statIndex($index)['size'];
                }
                if ($size > 32 * 1024 * 1024) {
                    $this->fail('Ukuran isi workbook terlalu besar.');
                }
            } finally {
                $zip->close();
            }

            $reader = new Xlsx();
            if (!$reader->canRead($file->getRealPath())) {
                $this->fail('Gunakan XLSX asli atau CSV.');
            }
            $info = $reader->listWorksheetInfo($file->getRealPath());
            if (!$info || $info[0]['totalRows'] > $limit + 1 || $info[0]['totalColumns'] > 3) {
                $this->fail('Worksheet pertama harus mempunyai tiga kolom dan tidak melebihi batas baris.');
            }
            $reader->setLoadSheetsOnly($info[0]['worksheetName']);
            $reader->setReadEmptyCells(false);
            $book = $reader->load($file->getRealPath());
            try {
                $sheet = $book->getSheet(0);
                for ($row = 1; $row <= $info[0]['totalRows']; $row++) {
                    $values = [];
                    foreach (['A', 'B', 'C'] as $column) {
                        $cell = $sheet->getCell($column.$row);
                        if ($cell->getDataType() === DataType::TYPE_FORMULA) {
                            $this->fail('Hapus formula pada baris '.$row.'.');
                        }
                        $values[] = trim((string) $cell->getFormattedValue());
                    }
                    $rows[] = $values;
                }
            } finally {
                $book->disconnectWorksheets();
            }
        }

        if (!$rows) {
            $this->fail('File kosong.');
        }
        $rows[0][0] = preg_replace('/^\xEF\xBB\xBF/', '', $rows[0][0] ?? '');
        if (array_map('strtolower', $rows[0]) !== ['student_number', 'full_name', 'graduation_year']) {
            $this->fail('Header harus student_number, full_name, graduation_year dalam urutan tersebut.');
        }
        return array_slice($rows, 1);
    }

    public function preview(UploadedFile $file, int $actorId): array
    {
        $rows = [];
        $seen = [];
        $existingMembers = array_fill_keys(Member::pluck('student_number')->all(), true);
        $existingUsernames = array_fill_keys(User::pluck('username')->all(), true);
        foreach ($this->readRows($file) as $offset => $values) {
            if (implode('', $values) === '') {
                continue;
            }
            if (!mb_check_encoding(implode('', $values), 'UTF-8')) {
                $this->fail('Gunakan file CSV dengan encoding UTF-8.');
            }
            $data = ['student_number' => $values[0] ?? '', 'full_name' => $values[1] ?? '', 'graduation_year' => $values[2] ?? ''];
            $validator = Validator::make($data, [
                'student_number' => ['required', 'string', 'regex:/^[0-9]{1,20}$/'],
                'full_name' => ['required', 'string', 'max:100', 'not_regex:/^[=+@-]/u'],
                'graduation_year' => 'required|integer|between:2000,2200',
            ]);
            $errors = $validator->errors()->all();
            if (count($values) !== 3) {
                $errors[] = 'Gunakan tiga kolom.';
            }
            $duplicate = isset($seen[$data['student_number']]) || isset($existingMembers[$data['student_number']]);
            if (isset($existingUsernames['s'.$data['student_number']]) && !$duplicate) {
                $errors[] = 'Username siswa bertabrakan dengan akun yang ada.';
            }
            $seen[$data['student_number']] = true;
            $rows[] = ['row' => $offset + 2, 'data' => $data, 'status' => $errors ? 'invalid' : ($duplicate ? 'duplicate' : 'valid'), 'errors' => $errors];
        }
        $id = (string) Str::uuid();
        DB::table('member_imports')->insert([
            'id' => $id,
            'created_by' => $actorId,
            'status' => 'preview',
            'rows' => json_encode($rows, JSON_THROW_ON_ERROR),
            'expires_at' => now()->addMinutes(30),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return ['id' => $id, 'rows' => $rows, 'expires_in_minutes' => 30];
    }

    public function commit(string $id, int $actorId): array
    {
        return DB::transaction(function () use ($id, $actorId) {
            $import = DB::table('member_imports')->where('id', $id)->where('created_by', $actorId)->lockForUpdate()->first();
            abort_unless($import, 404);
            if ($import->status === 'imported') {
                return json_decode($import->result, true, flags: JSON_THROW_ON_ERROR);
            }
            abort_if((int) $import->processed_rows === 0 && now()->greaterThan($import->expires_at), 422, 'Pratinjau kedaluwarsa. Unggah ulang file.');
            $rows = json_decode($import->rows, true, flags: JSON_THROW_ON_ERROR);
            $result = $import->result ? json_decode($import->result, true, flags: JSON_THROW_ON_ERROR) : ['created' => 0, 'skipped' => 0, 'invalid' => 0];
            $chunk = array_slice($rows, (int) $import->processed_rows, 25);
            foreach ($chunk as $row) {
                if ($row['status'] === 'invalid') {
                    $result['invalid']++;
                    continue;
                }
                if ($row['status'] === 'duplicate' || Member::where('student_number', $row['data']['student_number'])->exists()) {
                    $result['skipped']++;
                    continue;
                }
                $this->members->create($row['data'], $actorId);
                $result['created']++;
            }
            $result['processed'] = (int) $import->processed_rows + count($chunk);
            $result['total'] = count($rows);
            $result['complete'] = $result['processed'] >= $result['total'];
            DB::table('member_imports')->where('id', $id)->update(['status' => $result['complete'] ? 'imported' : 'preview', 'processed_rows' => $result['processed'], 'result' => json_encode($result, JSON_THROW_ON_ERROR), 'updated_at' => now()]);
            $this->audit->record($actorId, $result['complete'] ? 'members.imported' : 'members.import_progress', 'member_import', null, ['import_id' => $id, ...$result]);
            return $result;
        }, 3);
    }
}