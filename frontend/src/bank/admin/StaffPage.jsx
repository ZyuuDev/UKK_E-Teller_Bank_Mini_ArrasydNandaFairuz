import { useState } from 'react'
import { Plus } from 'lucide-react'
import { api, useResource } from '../api'
import {
  Button,
  ConfirmDialog,
  DataTable,
  Drawer,
  FormField,
  Input,
  Notice,
  PageHeader,
  ResourceState,
  Select,
  Status,
} from '../ui'

export default function StaffPage({ currentUser }) {
  const list = useResource('/admin/users')
  const [creating, setCreating] = useState(false)
  const [target, setTarget] = useState(null)
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
  return (
    <>
      <PageHeader
        title="Manajemen petugas"
        description="Atur akun administrator dan teller sekolah."
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
              ['username', 'Username'],
              ['name', 'Nama petugas'],
              [
                'role',
                'Peran',
                null,
                (row) => (
                  <span className="bank-status bank-status--neutral">
                    {row.role === 'admin' ? 'Administrator' : 'Teller'}
                  </span>
                ),
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
            actions={(row) => (
              <Button
                variant={row.is_active ? 'danger' : 'secondary'}
                disabled={String(row.id) === String(currentUser?.id)}
                title={
                  String(row.id) === String(currentUser?.id)
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
            )}
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
    </>
  )
}