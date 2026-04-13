import { useState, useEffect, useCallback } from 'react'
import { useRole } from '../context/RoleContext'
import { getAllResources, createResource, updateResource, deactivateResource } from '../api/mockHandlers'
import type { Resource, ResourceType } from '../data/types'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'
import TextInput from '../components/TextInput'
import SelectInput from '../components/SelectInput'
import DataCard from '../components/DataCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorToast from '../components/ErrorToast'
import ConfirmationModal from '../components/ConfirmationModal'

const typeOptions = [
  { value: 'zasedačka', label: 'Zasedačka' },
  { value: 'auto', label: 'Auto' },
  { value: 'zařízení', label: 'Zařízení' },
]

export default function SCR04_SpravaZdroju() {
  const { role } = useRole()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Form state
  const [editId, setEditId] = useState<string | null>(null)
  const [nazev, setNazev] = useState('')
  const [typ, setTyp] = useState<ResourceType | ''>('')
  const [popis, setPopis] = useState('')
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllResources(role)
      setResources(data)
    } catch {
      setError('Nepodařilo se načíst zdroje.')
    } finally {
      setLoading(false)
    }
  }, [role])

  useEffect(() => { load() }, [load])

  function resetForm() {
    setEditId(null)
    setNazev('')
    setTyp('')
    setPopis('')
    setShowForm(false)
  }

  function openEdit(r: Resource) {
    setEditId(r.id)
    setNazev(r.název)
    setTyp(r.typ)
    setPopis(r.popis)
    setShowForm(true)
  }

  async function handleSave() {
    if (!nazev.trim() || !typ) return
    setSaving(true)
    setError(null)
    try {
      if (editId) {
        await updateResource(role, editId, { název: nazev, typ, popis })
        console.log('telemetry: resource_updated', editId)
      } else {
        await createResource(role, { název: nazev, typ, popis })
        console.log('telemetry: resource_created')
      }
      setSuccessMsg('Zdroj uložen.')
      resetForm()
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(id: string) {
    try {
      await deactivateResource(role, id)
      console.log('telemetry: resource_deactivated', id)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
      {successMsg && (
        <ConfirmationModal
          title="Hotovo"
          message={successMsg}
          variant="success"
          confirmLabel="OK"
          onConfirm={() => setSuccessMsg(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand-dark">Správa zdrojů</h1>
        {!showForm && (
          <PrimaryButton onClick={() => setShowForm(true)}>+ Přidat zdroj</PrimaryButton>
        )}
      </div>

      {showForm && (
        <div className="bg-white border rounded-xl p-4 space-y-4">
          <h3 className="font-semibold text-brand-dark">{editId ? 'Upravit zdroj' : 'Nový zdroj'}</h3>
          <TextInput label="Název" value={nazev} onChange={setNazev} required maxLength={100} />
          <SelectInput label="Typ" value={typ} onChange={(v) => setTyp(v as ResourceType)} options={typeOptions} required placeholder="Vyberte typ..." />
          <TextInput label="Popis" value={popis} onChange={setPopis} maxLength={300} multiline />
          <div className="flex gap-3">
            <PrimaryButton onClick={handleSave} disabled={saving || !nazev.trim() || !typ}>
              {saving ? 'Ukládám...' : 'Uložit'}
            </PrimaryButton>
            <SecondaryButton onClick={resetForm}>Zrušit</SecondaryButton>
          </div>
        </div>
      )}

      {resources.length === 0 ? (
        <div className="text-center text-gray-500 py-8">Zatím nejsou definovány žádné zdroje. Přidejte první zdroj.</div>
      ) : (
        <div className="space-y-3">
          {resources.map((r) => (
            <DataCard key={r.id}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-sm text-brand-dark">{r.název}</h3>
                  <p className="text-xs text-gray-500 capitalize">{r.typ}</p>
                  {r.popis && <p className="text-sm text-gray-400 mt-1">{r.popis}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.aktivní ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {r.aktivní ? 'Aktivní' : 'Neaktivní'}
                </span>
              </div>
              <div className="flex gap-3 mt-3">
                <button onClick={() => openEdit(r)} className="text-sm text-brand-gold hover:underline">Upravit</button>
                <button onClick={() => handleDeactivate(r.id)} className="text-sm text-gray-500 hover:text-red-500">
                  {r.aktivní ? 'Deaktivovat' : 'Aktivovat'}
                </button>
              </div>
            </DataCard>
          ))}
        </div>
      )}
    </div>
  )
}
