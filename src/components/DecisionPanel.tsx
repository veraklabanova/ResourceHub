import { useState, useEffect } from 'react'
import type { Conflict, DecisionVariant } from '../data/types'
import { useDecision, DECISION_STRATEGIES } from '../context/DecisionContext'
import { useRole } from '../context/RoleContext'
import { resolveConflict } from '../api/mockHandlers'
import PrimaryButton from './PrimaryButton'

interface Props {
  conflict: Conflict
  onResolved: () => void
  onClose: () => void
}

function SlaCountdown({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState('')
  const [urgent, setUrgent] = useState(false)

  useEffect(() => {
    function update() {
      const diff = new Date(deadline).getTime() - Date.now()
      if (diff <= 0) {
        setRemaining('VYPRŠELO')
        setUrgent(true)
        return
      }
      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setRemaining(`${mins}:${String(secs).padStart(2, '0')}`)
      setUrgent(mins < 10)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [deadline])

  return (
    <div className={`text-xs font-mono px-2 py-1 rounded ${urgent ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-amber-50 text-amber-700'}`}>
      SLA: {remaining}
    </div>
  )
}

export default function DecisionPanel({ conflict, onResolved, onClose }: Props) {
  const { addRecord, checkGuardrail } = useDecision()
  const { currentUser } = useRole()
  const [selected, setSelected] = useState<string | null>(null)
  const [zdůvodnění, setZdůvodnění] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const strategy = DECISION_STRATEGIES[conflict.typ]
  const variants = strategy?.variants ?? []
  const guardrail = strategy?.guarding_invariant ?? ''
  const fallback = strategy?.fallback ?? ''

  async function handleResolve() {
    if (!selected || zdůvodnění.length < 5) {
      setError('Vyberte variantu a uveďte zdůvodnění (min. 5 znaků).')
      return
    }

    const check = checkGuardrail(conflict, selected)
    if (!check.pass) {
      setError(`Guardrail: ${check.reason}`)
      return
    }

    setSaving(true)
    setError(null)

    try {
      const variant = variants.find((v) => v.id === selected)!
      await resolveConflict('admin', conflict.id, {
        varianta_id: selected,
        varianta_název: variant.název,
        rozhodl: currentUser.jméno,
        zdůvodnění,
      })

      addRecord({
        conflict_id: conflict.id,
        typ: conflict.typ,
        situace: conflict.popis,
        varianty: variants,
        zvolená_varianta: selected,
        rozhodl: currentUser.jméno,
        zdůvodnění,
        eskalace: conflict.eskalace ?? 'L2',
        guardrail_check: 'pass',
      })

      console.log('telemetry: decision_resolved', { conflict_id: conflict.id, variant: selected })
      onResolved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při ukládání.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-brand-dark text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-brand-gold font-semibold uppercase tracking-wide">Decision Layer — {conflict.eskalace ?? 'L2'}</p>
              <h2 className="text-lg font-bold mt-1">Rozhodnutí o konfliktu</h2>
            </div>
            {conflict.sla_deadline && <SlaCountdown deadline={conflict.sla_deadline} />}
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Situace */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Situace</h3>
            <p className="text-sm text-gray-800 mt-1">{conflict.popis}</p>
          </div>

          {/* Guardrail */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Guardrail</h3>
            <p className="text-xs text-amber-800 mt-1">{guardrail}</p>
          </div>

          {/* Varianty */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Varianty rozhodnutí</h3>
            <div className="space-y-2">
              {variants.map((v: DecisionVariant) => (
                <button
                  key={v.id}
                  onClick={() => setSelected(v.id)}
                  className={`w-full text-left border-2 rounded-xl p-3 transition-all ${
                    selected === v.id
                      ? 'border-brand-gold bg-brand-gold/5 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-semibold text-brand-dark">{v.název}</span>
                    {v.doporučená && (
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Doporučená</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{v.akce}</p>
                  <div className="flex gap-4 mt-2 text-[10px]">
                    <span className="text-gray-500">Dopad: {v.dopad}</span>
                  </div>
                  <div className="text-[10px] text-red-500 mt-1">Riziko: {v.riziko}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Fallback info */}
          <div className="bg-gray-50 border rounded-lg p-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fallback při vypršení SLA</h3>
            <p className="text-xs text-gray-600 mt-1">{fallback}</p>
          </div>

          {/* Zdůvodnění */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Zdůvodnění rozhodnutí *</label>
            <textarea
              value={zdůvodnění}
              onChange={(e) => setZdůvodnění(e.target.value)}
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold resize-none"
              rows={3}
              placeholder="Proč jste zvolili tuto variantu? (min. 5 znaků)"
            />
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3">
            <PrimaryButton onClick={handleResolve} disabled={saving || !selected}>
              {saving ? 'Ukládám...' : 'Potvrdit rozhodnutí'}
            </PrimaryButton>
            <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
              Zrušit
            </button>
          </div>

          {/* Audit note */}
          <p className="text-[10px] text-gray-400 text-center">
            Rozhodnutí bude zaznamenáno v Decision Log (kdo, kdy, varianta, zdůvodnění).
          </p>
        </div>
      </div>
    </div>
  )
}
