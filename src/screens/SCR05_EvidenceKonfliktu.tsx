import { useState, useEffect, useCallback } from 'react'
import { useRole } from '../context/RoleContext'
import { getConflicts, createConflict, getAllReservations } from '../api/mockHandlers'
import type { Conflict, Reservation, ConflictType } from '../data/types'
import { resources } from '../data/seedData'
import PrimaryButton from '../components/PrimaryButton'
import TextInput from '../components/TextInput'
import SelectInput from '../components/SelectInput'
import DataCard from '../components/DataCard'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorToast from '../components/ErrorToast'
import ConfirmationModal from '../components/ConfirmationModal'

type Tab = 'otevřené' | 'vyřešené'

const conflictTypes = [
  { value: 'no_show', label: 'No-show' },
  { value: 'neoprávněné_užití', label: 'Neoprávněné užití' },
  { value: 'dvojitá_rezervace', label: 'Dvojitá rezervace' },
]

export default function SCR05_EvidenceKonfliktu() {
  const { role } = useRole()
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [allReservations, setAllReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('otevřené')
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null)

  // Form
  const [typ, setTyp] = useState<ConflictType | ''>('')
  const [rezId, setRezId] = useState('')
  const [popis, setPopis] = useState('')
  const [reseni, setReseni] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [c, r] = await Promise.all([getConflicts(role), getAllReservations(role)])
      setConflicts(c)
      setAllReservations(r)
    } catch {
      setError('Nepodařilo se načíst data.')
    } finally {
      setLoading(false)
    }
  }, [role])

  useEffect(() => { load() }, [load])

  async function handleSubmit() {
    if (!typ || !rezId || popis.length < 10) {
      setError('Vyplňte typ konfliktu a popis (min. 10 znaků).')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await createConflict(role, { rezervace_id: rezId, typ, popis, řešení: reseni })
      console.log('telemetry: conflict_reported')
      setSuccessMsg('Konflikt evidován a vyřešen.')
      setTyp('')
      setRezId('')
      setPopis('')
      setReseni('')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba')
    } finally {
      setSaving(false)
    }
  }

  const open = conflicts.filter((c) => c.stav === 'otevřený')
  const resolved = conflicts.filter((c) => c.stav === 'vyřešený')
  const activeReservations = allReservations.filter((r) => r.stav === 'aktivní' || r.stav === 'vytvořena')

  function getReservationLabel(resId: string) {
    const r = allReservations.find((x) => x.id === resId)
    if (!r) return resId
    const resource = resources.find((x) => x.id === r.zdroj_id)
    return `${resource?.název ?? '?'} — ${new Date(r.od).toLocaleDateString('cs-CZ')}`
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
      {successMsg && (
        <ConfirmationModal title="Hotovo" message={successMsg} variant="success" confirmLabel="OK" onConfirm={() => setSuccessMsg(null)} />
      )}
      {selectedConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedConflict(null)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between">
              <h3 className="font-semibold text-brand-dark">Detail konfliktu</h3>
              <StatusBadge status={selectedConflict.stav} />
            </div>
            <div className="text-sm space-y-1 text-gray-600">
              <p><span className="font-medium">Typ:</span> {conflictTypes.find((t) => t.value === selectedConflict.typ)?.label}</p>
              <p><span className="font-medium">Rezervace:</span> {getReservationLabel(selectedConflict.rezervace_id)}</p>
              <p><span className="font-medium">Popis:</span> {selectedConflict.popis}</p>
              {selectedConflict.řešení && <p><span className="font-medium">Řešení:</span> {selectedConflict.řešení}</p>}
              <p><span className="font-medium">Vytvořeno:</span> {new Date(selectedConflict.vytvořeno).toLocaleString('cs-CZ')}</p>
            </div>
            <button onClick={() => setSelectedConflict(null)} className="text-sm text-brand-gold hover:underline">Zavřít</button>
          </div>
        </div>
      )}

      <h1 className="text-xl font-bold text-brand-dark">Evidence konfliktů</h1>

      {/* Form */}
      <div className="bg-white border rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-brand-dark text-sm">Nový konflikt</h3>
        <SelectInput label="Typ konfliktu" value={typ} onChange={(v) => setTyp(v as ConflictType)} options={conflictTypes} required placeholder="Vyberte typ..." />
        <SelectInput
          label="Rezervace"
          value={rezId}
          onChange={setRezId}
          options={activeReservations.map((r) => ({ value: r.id, label: getReservationLabel(r.id) }))}
          required
          placeholder="Vyberte rezervaci..."
        />
        <TextInput label="Popis" value={popis} onChange={setPopis} required maxLength={500} multiline placeholder="Minimálně 10 znaků" />
        <TextInput label="Řešení" value={reseni} onChange={setReseni} maxLength={500} multiline placeholder="Popis řešení (volitelné)" />
        <PrimaryButton onClick={handleSubmit} disabled={saving}>
          {saving ? 'Ukládám...' : 'Evidovat'}
        </PrimaryButton>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {(['otevřené', 'vyřešené'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
              activeTab === tab ? 'bg-white shadow text-brand-dark' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab} ({tab === 'otevřené' ? open.length : resolved.length})
          </button>
        ))}
      </div>

      {(activeTab === 'otevřené' ? open : resolved).length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          {activeTab === 'otevřené' ? 'Žádné otevřené konflikty. Vše je v pořádku.' : 'Žádné vyřešené konflikty.'}
        </div>
      ) : (
        <div className="space-y-3">
          {(activeTab === 'otevřené' ? open : resolved).map((c) => (
            <DataCard
              key={c.id}
              onClick={() => { console.log('telemetry: conflict_detail_viewed', c.id); setSelectedConflict(c) }}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-sm text-brand-dark">
                  {conflictTypes.find((t) => t.value === c.typ)?.label}
                </h3>
                <StatusBadge status={c.stav} />
              </div>
              <p className="text-sm text-gray-500">{getReservationLabel(c.rezervace_id)}</p>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{c.popis}</p>
            </DataCard>
          ))}
        </div>
      )}
    </div>
  )
}
