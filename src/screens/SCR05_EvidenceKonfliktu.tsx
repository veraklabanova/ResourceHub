import { useState, useEffect, useCallback } from 'react'
import { useRole } from '../context/RoleContext'
import { useDecision } from '../context/DecisionContext'
import { getConflicts, createConflict, getAllReservations, checkSlaFallbacks } from '../api/mockHandlers'
import type { Conflict, Reservation, ConflictType } from '../data/types'
import { resources } from '../data/seedData'
import { DECISION_STRATEGIES } from '../context/DecisionContext'
import PrimaryButton from '../components/PrimaryButton'
import TextInput from '../components/TextInput'
import SelectInput from '../components/SelectInput'
import DataCard from '../components/DataCard'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorToast from '../components/ErrorToast'
import ConfirmationModal from '../components/ConfirmationModal'
import DecisionPanel from '../components/DecisionPanel'

type Tab = 'čeká_na_řešení' | 'vyřešené'

const conflictTypes = [
  { value: 'no_show', label: 'No-show' },
  { value: 'neoprávněné_užití', label: 'Neoprávněné užití' },
  { value: 'dvojitá_rezervace', label: 'Dvojitá rezervace' },
]

export default function SCR05_EvidenceKonfliktu() {
  const { role } = useRole()
  const { getSlaMinutes } = useDecision()
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [allReservations, setAllReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('čeká_na_řešení')
  const [decidingConflict, setDecidingConflict] = useState<Conflict | null>(null)

  // Form
  const [typ, setTyp] = useState<ConflictType | ''>('')
  const [rezId, setRezId] = useState('')
  const [popis, setPopis] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Check SLA fallbacks first
      await checkSlaFallbacks(role)
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

  // SLA checker — periodically check for expired SLAs
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const expired = await checkSlaFallbacks(role)
        if (expired.length > 0) {
          load()
          setSuccessMsg(`${expired.length} konflikt(y) automaticky vyřešen(y) — SLA vypršelo.`)
        }
      } catch { /* ignore */ }
    }, 15000) // check every 15s
    return () => clearInterval(interval)
  }, [role, load])

  async function handleSubmit() {
    if (!typ || !rezId || popis.length < 10) {
      setError('Vyplňte typ konfliktu a popis (min. 10 znaků).')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const sla = getSlaMinutes(typ as ConflictType)
      await createConflict(role, { rezervace_id: rezId, typ: typ as ConflictType, popis, řešení: '', sla_minutes: sla })
      console.log('telemetry: conflict_reported', { typ })
      setSuccessMsg('Konflikt evidován. Čeká na rozhodnutí správce.')
      setTyp('')
      setRezId('')
      setPopis('')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba')
    } finally {
      setSaving(false)
    }
  }

  const pending = conflicts.filter((c) => c.stav === 'čeká_na_řešení' || c.stav === 'otevřený')
  const resolved = conflicts.filter((c) => c.stav === 'vyřešený')
  const activeReservations = allReservations.filter((r) => r.stav === 'aktivní' || r.stav === 'vytvořena')

  function getReservationLabel(resId: string) {
    const r = allReservations.find((x) => x.id === resId)
    if (!r) return resId
    const resource = resources.find((x) => x.id === r.zdroj_id)
    return `${resource?.název ?? '?'} — ${new Date(r.od).toLocaleDateString('cs-CZ')}`
  }

  function getSlaStatus(conflict: Conflict) {
    if (!conflict.sla_deadline) return null
    const diff = new Date(conflict.sla_deadline).getTime() - Date.now()
    if (diff <= 0) return 'expired'
    if (diff < 10 * 60 * 1000) return 'urgent'
    return 'ok'
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
      {successMsg && (
        <ConfirmationModal title="Hotovo" message={successMsg} variant="success" confirmLabel="OK" onConfirm={() => setSuccessMsg(null)} />
      )}
      {decidingConflict && (
        <DecisionPanel
          conflict={decidingConflict}
          onResolved={() => { setDecidingConflict(null); load(); setSuccessMsg('Rozhodnutí zaznamenáno v Decision Log.') }}
          onClose={() => setDecidingConflict(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand-dark">Evidence konfliktů</h1>
        {pending.length > 0 && (
          <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full animate-pulse">
            {pending.length} čeká na rozhodnutí
          </span>
        )}
      </div>

      {/* Form — report new conflict */}
      <div className="bg-white border rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-brand-dark text-sm">Nahlásit nový konflikt</h3>
        <SelectInput label="Typ konfliktu" value={typ} onChange={(v) => setTyp(v as ConflictType)} options={conflictTypes} required placeholder="Vyberte typ..." />
        {typ && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-800">
            <strong>SLA:</strong> {DECISION_STRATEGIES[typ as ConflictType]?.sla_minutes ?? '?'} min | <strong>Eskalace:</strong> {DECISION_STRATEGIES[typ as ConflictType]?.escalation ?? '?'}
          </div>
        )}
        <SelectInput
          label="Rezervace"
          value={rezId}
          onChange={setRezId}
          options={activeReservations.map((r) => ({ value: r.id, label: getReservationLabel(r.id) }))}
          required
          placeholder="Vyberte rezervaci..."
        />
        <TextInput label="Popis situace" value={popis} onChange={setPopis} required maxLength={500} multiline placeholder="Co se stalo? (min. 10 znaků)" />
        <PrimaryButton onClick={handleSubmit} disabled={saving}>
          {saving ? 'Ukládám...' : 'Nahlásit konflikt'}
        </PrimaryButton>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {(['čeká_na_řešení', 'vyřešené'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab ? 'bg-white shadow text-brand-dark' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'čeká_na_řešení' ? `Čeká na řešení (${pending.length})` : `Vyřešené (${resolved.length})`}
          </button>
        ))}
      </div>

      {/* List */}
      {(activeTab === 'čeká_na_řešení' ? pending : resolved).length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          {activeTab === 'čeká_na_řešení' ? 'Žádné konflikty čekající na rozhodnutí.' : 'Žádné vyřešené konflikty.'}
        </div>
      ) : (
        <div className="space-y-3">
          {(activeTab === 'čeká_na_řešení' ? pending : resolved).map((c) => {
            const slaStatus = getSlaStatus(c)
            return (
              <DataCard key={c.id} onClick={() => {
                if (c.stav === 'čeká_na_řešení' || c.stav === 'otevřený') {
                  console.log('telemetry: decision_panel_opened', c.id)
                  setDecidingConflict(c)
                }
              }}>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-sm text-brand-dark">
                    {conflictTypes.find((t) => t.value === c.typ)?.label}
                  </h3>
                  <div className="flex items-center gap-2">
                    {c.eskalace && <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.eskalace}</span>}
                    <StatusBadge status={c.stav} />
                  </div>
                </div>
                <p className="text-sm text-gray-500">{getReservationLabel(c.rezervace_id)}</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{c.popis}</p>

                {/* SLA indicator for pending */}
                {(c.stav === 'čeká_na_řešení') && c.sla_deadline && (
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      slaStatus === 'expired' ? 'bg-red-100 text-red-700' :
                      slaStatus === 'urgent' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                      'bg-green-50 text-green-700'
                    }`}>
                      SLA: {slaStatus === 'expired' ? 'VYPRŠELO' : `${Math.max(0, Math.round((new Date(c.sla_deadline).getTime() - Date.now()) / 60000))} min`}
                    </span>
                    <span className="text-xs text-brand-gold font-semibold cursor-pointer hover:underline">Rozhodnout →</span>
                  </div>
                )}

                {/* Resolution info for resolved */}
                {c.stav === 'vyřešený' && c.rozhodl && (
                  <div className="mt-2 bg-green-50 rounded-lg p-2 text-[10px] text-green-800 space-y-0.5">
                    <p><strong>Řešení:</strong> {c.řešení}</p>
                    <p><strong>Rozhodl:</strong> {c.rozhodl} | {c.rozhodnuto ? new Date(c.rozhodnuto).toLocaleString('cs-CZ') : ''}</p>
                    {c.zdůvodnění && <p><strong>Proč:</strong> {c.zdůvodnění}</p>}
                  </div>
                )}
              </DataCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
