import { useState } from 'react'
import { KeyRound, Pencil, Plus } from 'lucide-react'
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
  ResourceState,
  Select,
  Status,
  UserRoleBadge,
} from '../ui'

export default function StaffPage({ currentUser }) {
  const list = useResource('/admin/users')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(null)
  const [target, setTarget] = useState(null)
  const [resetTarget, setResetTarget] = useState(null)
  const [credentials, setCredentials] = useState(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function create(event) {
    event.preventDefault()
    const form = event.currentTarget
    const body = Object.fromEntries(new FormData(form))
    setBusy(true)
    setError('')
    try {
      await api('/admin/users', { method: 'POST', body })
      form.reset()
      setCreating(false)
      setMessage('Petugas berhasil ditambahkan.')
      list.refresh()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveName(event) {
    event.preventDefault()
    if (!editing) return
    const form = event.currentTarget
    const name = String(new FormData(form).get('name') || '').trim()
    setBusy(true)
    setError('')
    try {
      await api(`/admin/users/${editing.id}`, {
        method: 'PATCH',
        body: { name, is_active: editing.is_active },
      })
      setEditing(null)
      setMessage('Nama petugas berhasil diperbarui.')
      list.refresh()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  async function update() {
    setBusy(true)
    setError('')
    try {
      await api(`/admin/users/${target.id}`, {
        method: 'PATCH',
        body: { name: target.name, is_active: !target.is_active },
      })
      setTarget(null)
      setMessage('Status petugas diperbarui.')
      list.refresh()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  async function issueTemporaryPassword() {
    if (!resetTarget) return
    setBusy(true)
    setError('')
    try {
      const result = await api(`/admin/users/${resetTarget.id}/credentials`, {
        method: 'POST',
      })
      setResetTarget(null)
      setCopied(false)
      setCredentials(result.data)
      setMessage(`Password sementara untuk ${result.data.name} berhasil diterbitkan.`)
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
        title="Manajemen petugas"
        description="Atur akun administrator dan teller loket sekolah, ubah nama identitas, atau terbitkan password sementara."
        actions={
          <Button
            onClick={() => {
              setError('')
              setCreating(true)
            }}
          >
            <Plus size={18} aria-hidden="true" />
            Tambah petugas
          </Button>
        }
      />
      <Notice>{message}</Notice>
      <section className="bank-panel">
        <h2>Daftar petugas</h2>
        <ResourceState resource={list}>
          <DataTable
            caption="Daftar petugas"
            rows={list.data}
            columns={[
              ['username', 'Username', null, (row) => `@${row.username}`],
              ['name', 'Nama petugas'],
              [
                'role',
                'Peran',
                null,
                (row) => <UserRoleBadge role={row.role} />,
              ],
              [
                'is_active',
                'Status',
                null,
                (row) => (
                  <Status value={row.is_active ? 'service_active' : 'service_blocked'} />
                ),
              ],
            ]}
            actions={(row) => {
              const isSelf = String(row.id) === String(currentUser?.id)
              return (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setError('')
                      setEditing(row)
                    }}
                  >
                    <Pencil size={15} aria-hidden="true" />
                    Ubah nama
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={isSelf}
                    title={
                      isSelf
                        ? 'Gunakan menu Kelola akun untuk mengganti password sendiri'
                        : undefined
                    }
                    onClick={() => {
                      setError('')
                      setResetTarget(row)
                    }}
                  >
                    <KeyRound size={15} aria-hidden="true" />
                    Reset password
                  </Button>
                  <Button
                    variant={row.is_active ? 'danger' : 'secondary'}
                    disabled={isSelf}
                    title={
                      isSelf
                        ? 'Akun yang sedang digunakan tidak dapat dinonaktifkan'
                        : undefined
                    }
                    onClick={() => {
                      setError('')
                      setTarget(row)
                    }}
                  >
                    {row.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                </>
              )
            }}
          />
        </ResourceState>
      </section>
      <Drawer
        open={creating}
        title="Tambah petugas"
        busy={busy}
        onClose={() => {
          setCreating(false)
          setError('')
        }}
      >
        <Notice error>{error}</Notice>
        <form className="bank-form" onSubmit={create}>
          <FormField label="Username">
            <Input name="username" maxLength={50} autoComplete="off" required />
          </FormField>
          <FormField label="Nama lengkap">
            <Input name="name" maxLength={100} required />
          </FormField>
          <FormField
            label="Password sementara"
            hint="Minimal 12 karakter. Serahkan secara pribadi."
          >
            <Input
              name="password"
              type="password"
              minLength={12}
              maxLength={100}
              autoComplete="new-password"
              required
            />
          </FormField>
          <FormField label="Peran">
            <Select name="role" defaultValue="teller">
              <option value="teller">Teller</option>
              <option value="admin">Administrator</option>
            </Select>
          </FormField>
          <Button type="submit" busy={busy}>
            Simpan petugas
          </Button>
        </form>
      </Drawer>
      <Drawer
        open={!!editing}
        title="Ubah nama petugas"
        busy={busy}
        onClose={() => {
          setEditing(null)
          setError('')
        }}
      >
        <Notice error>{error}</Notice>
        {editing && (
          <form className="bank-form" onSubmit={saveName} key={editing.id}>
            <FormField label="Username akun">
              <Input value={`@${editing.username}`} readOnly disabled />
            </FormField>
            <FormField label="Nama lengkap petugas">
              <Input
                name="name"
                defaultValue={editing.name}
                maxLength={100}
                required
                disabled={busy}
              />
            </FormField>
            <div className="bank-actions bank-actions--end">
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setEditing(null)
                  setError('')
                }}
              >
                Batal
              </Button>
              <Button type="submit" busy={busy}>
                Simpan perubahan
              </Button>
            </div>
          </form>
        )}
      </Drawer>
      <ConfirmDialog
        open={!!target}
        title={target?.is_active ? 'Nonaktifkan petugas?' : 'Aktifkan petugas?'}
        busy={busy}
        error={error}
        danger={!!target?.is_active}
        onClose={() => {
          setTarget(null)
          setError('')
        }}
        onConfirm={update}
      >
        <p>
          Perubahan akses untuk <strong>{target?.name}</strong> (@{target?.username}).
          Periksa identitas sebelum melanjutkan.
        </p>
      </ConfirmDialog>
      <ConfirmDialog
        open={!!resetTarget}
        title="Terbitkan password sementara petugas?"
        busy={busy}
        error={error}
        confirmLabel="Ya, reset password"
        onClose={() => {
          setResetTarget(null)
          setError('')
        }}
        onConfirm={issueTemporaryPassword}
      >
        <p>
          Petugas: <strong>{resetTarget?.name}</strong> (@{resetTarget?.username})
        </p>
        <p>
          Sesi aktif petugas akan diakhiri dan sistem akan membuat password sementara 16
          karakter. Petugas wajib mengganti password tersebut saat login kembali.
        </p>
      </ConfirmDialog>
      <Modal
        open={!!credentials}
        title="Kredensial sementara petugas"
        onClose={() => setCredentials(null)}
      >
        {credentials && (
          <>
            <Notice>
              Salin dan berikan password sementara ini secara langsung kepada petugas yang
              bersangkutan. Password ini hanya ditampilkan satu kali.
            </Notice>
            <dl className="bank-detail-list">
              <DetailRow label="Nama petugas">{credentials.name}</DetailRow>
              <DetailRow label="Username">{credentials.username}</DetailRow>
              <DetailRow label="Password sementara">
                <code className="admin-secret">{credentials.temporary_password}</code>
              </DetailRow>
            </dl>
            <div className="bank-actions bank-actions--end">
              <Button
                variant="secondary"
                onClick={() => {
                  navigator.clipboard?.writeText(credentials.temporary_password)
                  setCopied(true)
                }}
              >
                {copied ? 'Tersalin!' : 'Salin password'}
              </Button>
              <Button onClick={() => setCredentials(null)}>Selesai</Button>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}