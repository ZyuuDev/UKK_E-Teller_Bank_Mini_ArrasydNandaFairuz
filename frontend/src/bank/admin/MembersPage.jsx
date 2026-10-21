import { useState } from 'react'
import { Plus, RotateCcw } from 'lucide-react'
import { api, useResource } from '../api'
import {
  Button,
  ConfirmDialog,
  DataTable,
  DetailRow,
  Drawer,
  FormField,
  Input,
  Modal,
  Notice,
  PageHeader,
  Pager,
  ResourceState,
  SearchField,
  Select,
  Status,
} from '../ui'

const emptyFilter = { q: '', graduation_year: '', account_status: '' }

export default function MembersPage() {
  const [draft, setDraft] = useState(emptyFilter)
  const [filter, setFilter] = useState(emptyFilter)
  const [page, setPage] = useState(1)
  const [editor, setEditor] = useState(null)
  const [detail, setDetail] = useState(null)
  const [action, setAction] = useState(null)
  const [credentials, setCredentials] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const list = useResource(`/admin/members?${new URLSearchParams({ ...filter, page })}`)
  function startEdit(row = null) {
    setError('')
    setEditor({ row })
  }
  function ask(row, type) {
    setError('')
    setAction({ row, type })
  }
  async function save(event) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    setBusy(true)
    setError('')
    try {
      await api(editor.row ? `/admin/members/${editor.row.user_id}` : '/admin/members', {
        method: editor.row ? 'PUT' : 'POST',
        body: { ...values, graduation_year: Number(values.graduation_year) },
      })
      setEditor(null)
      setMessage(
        'Data anggota disimpan. Aktivasi rekening dilakukan melalui setoran pertama teller.',
      )
      list.refresh()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  async function confirm() {
    const { row, type } = action
    setBusy(true)
    setError('')
    try {
      if (type === 'credentials') {
        const result = await api(`/admin/members/${row.user_id}/credentials`, {
          method: 'POST',
        })
        setCredentials(result.data)
      } else if (type === 'delete') {
        await api(`/admin/members/${row.user_id}`, { method: 'DELETE' })
      } else {
        await api(`/admin/student-access/${row.user_id}`, {
          method: 'PATCH',
          body: { is_active: !row.user.is_active },
        })
      }
      setAction(null)
      setMessage('Tindakan berhasil diproses.')
      list.refresh()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <PageHeader
        title="Kelola anggota"
        description="Kelola data siswa dan akses layanan. Rekening aktif melalui setoran pertama di teller."
        actions={
          <Button onClick={() => startEdit()}>
            <Plus size={18} aria-hidden="true" />
            Tambah anggota
          </Button>
        }
      />
      <Notice>{message}</Notice>
      <section className="bank-panel">
        <form
          className="admin-filters"
          onSubmit={(event) => {
            event.preventDefault()
            setFilter({ ...draft })
            setPage(1)
          }}
        >
          <SearchField
            label="Nama atau nomor siswa"
            value={draft.q}
            onChange={(event) => setDraft({ ...draft, q: event.target.value })}
            placeholder="Cari anggota"
          />
          <FormField label="Tahun kelulusan">
            <Input
              type="number"
              min={2000}
              max={2200}
              placeholder="Semua tahun"
              value={draft.graduation_year}
              onChange={(event) =>
                setDraft({ ...draft, graduation_year: event.target.value })
              }
            />
          </FormField>
          <FormField label="Status rekening">
            <Select
              value={draft.account_status}
              onChange={(event) =>
                setDraft({ ...draft, account_status: event.target.value })
              }
            >
              <option value="">Semua status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Belum aktif</option>
            </Select>
          </FormField>
          <div className="bank-actions">
            <Button type="submit">Terapkan</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setDraft(emptyFilter)
                setFilter(emptyFilter)
                setPage(1)
              }}
            >
              <RotateCcw size={16} aria-hidden="true" />
              Reset
            </Button>
          </div>
        </form>
      </section>
      <section className="bank-panel">
        <div className="bank-panel__head">
          <h2>Daftar anggota</h2>
          <Button variant="secondary" onClick={list.refresh}>
            Muat ulang
          </Button>
        </div>
        <ResourceState resource={list}>
          <DataTable
            caption="Daftar anggota sekolah"
            rows={list.data?.data}
            columns={[
              ['student_number', 'Nomor siswa'],
              ['full_name', 'Nama siswa'],
              ['graduation_year', 'Tahun lulus'],
              ['account_status', 'Rekening', 'status'],
              [
                'user',
                'Akses layanan',
                null,
                (row) =>
                  typeof row.user?.is_active === 'boolean' ? (
                    <Status
                      value={row.user.is_active ? 'service_active' : 'service_blocked'}
                    />
                  ) : (
                    'Tidak tersedia'
                  ),
              ],
            ]}
            actions={(row) => (
              <>
                <Button variant="secondary" onClick={() => setDetail(row)}>
                  Detail
                </Button>
                <details className="admin-row-menu">
                  <summary>Aksi</summary>
                  <div className="admin-row-menu__items">
                    <Button variant="secondary" onClick={() => startEdit(row)}>
                      Edit data
                    </Button>
                    <Button variant="secondary" onClick={() => ask(row, 'credentials')}>
                      Terbitkan akses sementara
                    </Button>
                    {typeof row.user?.is_active === 'boolean' && (
                      <Button variant="secondary" onClick={() => ask(row, 'access')}>
                        {row.user.is_active
                          ? 'Blokir akses layanan'
                          : 'Aktifkan akses layanan'}
                      </Button>
                    )}
                    {row.account_status === 'inactive' && (
                      <Button variant="danger" onClick={() => ask(row, 'delete')}>
                        Hapus anggota
                      </Button>
                    )}
                  </div>
                </details>
              </>
            )}
          />
          <Pager data={list.data} page={page} onChange={setPage} />
        </ResourceState>
      </section>
      <Drawer
        open={!!editor}
        title={editor?.row ? 'Edit anggota' : 'Tambah anggota'}
        busy={busy}
        onClose={() => {
          setEditor(null)
          setError('')
        }}
      >
        <Notice error>{error}</Notice>
        {editor && (
          <form className="bank-form" onSubmit={save} key={editor.row?.user_id || 'new'}>
            <FormField
              label="Nomor siswa"
              hint="Angka disimpan sebagai teks agar nol di depan tetap ada."
            >
              <Input
                name="student_number"
                inputMode="numeric"
                pattern="[0-9]{1,20}"
                maxLength={20}
                defaultValue={editor.row?.student_number || ''}
                required
              />
            </FormField>
            <FormField label="Nama lengkap">
              <Input
                name="full_name"
                maxLength={100}
                defaultValue={editor.row?.full_name || ''}
                required
              />
            </FormField>
            <FormField label="Tahun kelulusan">
              <Input
                name="graduation_year"
                type="number"
                min={2000}
                max={2200}
                defaultValue={editor.row?.graduation_year || ''}
                required
              />
            </FormField>
            <div className="bank-actions bank-actions--end">
              <Button variant="secondary" disabled={busy} onClick={() => setEditor(null)}>
                Batal
              </Button>
              <Button type="submit" busy={busy}>
                Simpan anggota
              </Button>
            </div>
          </form>
        )}
      </Drawer>
      <Drawer open={!!detail} title="Detail anggota" onClose={() => setDetail(null)}>
        {detail && (
          <>
            <h3>{detail.full_name}</h3>
            <dl className="bank-detail-list">
              <DetailRow label="Nomor siswa">{detail.student_number}</DetailRow>
              <DetailRow label="Tahun lulus">{detail.graduation_year}</DetailRow>
              <DetailRow label="Status rekening">
                <Status value={detail.account_status} />
              </DetailRow>
              <DetailRow label="Username">{detail.user?.username}</DetailRow>
              <DetailRow label="Akses layanan">
                {typeof detail.user?.is_active === 'boolean' ? (
                  <Status
                    value={detail.user.is_active ? 'service_active' : 'service_blocked'}
                  />
                ) : (
                  'Tidak tersedia'
                )}
              </DetailRow>
            </dl>
            <p className="admin-footnote">
              Saldo dan QR tersedia pada menu Rekening penabung setelah rekening
              terbentuk.
            </p>
          </>
        )}
      </Drawer>
      <ConfirmDialog
        open={!!action}
        title={
          action?.type === 'delete'
            ? 'Hapus anggota?'
            : action?.type === 'credentials'
              ? 'Terbitkan akses sementara?'
              : 'Ubah akses layanan?'
        }
        busy={busy}
        error={error}
        danger={
          action?.type === 'delete' ||
          (action?.type === 'access' && action?.row.user.is_active)
        }
        onClose={() => {
          setAction(null)
          setError('')
        }}
        onConfirm={confirm}
      >
        <p>
          Anggota: <strong>{action?.row.full_name}</strong> ({action?.row.student_number}
          ).
        </p>
        <p>
          {action?.type === 'delete'
            ? 'Backend akan memeriksa rekening dan aktivitas terkait sebelum mengizinkan penghapusan.'
            : action?.type === 'credentials'
              ? 'Password sementara akan diperbarui dan sesi siswa dicabut. Serahkan akses baru secara pribadi.'
              : 'Tindakan ini mengubah akses layanan siswa. Status rekening mengikuti aturan backend.'}
        </p>
      </ConfirmDialog>
      <Modal
        open={!!credentials}
        title="Akses sementara siswa"
        onClose={() => setCredentials(null)}
      >
        <Notice>
          Serahkan langsung kepada siswa. Tutup setelah dicatat secara pribadi.
        </Notice>
        {credentials && (
          <dl className="bank-detail-list">
            <DetailRow label="Username">{credentials.username}</DetailRow>
            <DetailRow label="Password sementara">
              <code>{credentials.temporary_password}</code>
            </DetailRow>
          </dl>
        )}
        <Button onClick={() => setCredentials(null)}>Selesai dan tutup</Button>
      </Modal>
    </>
  )
}