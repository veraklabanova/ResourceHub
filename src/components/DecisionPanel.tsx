import { useState, useEffect } from 'react'
import type { DecisionStrategy, DecisionVariant, ConflictType, EscalationLevel } from '../data/types'
import { useDecision } from '../context/DecisionContext'
import { useRole } from '../context/RoleContext'
import PrimaryButton from './PrimaryButton'
import SecondaryButton from './SecondaryButton'

interface DecisionPanelProps {
  conflictId: string
  conflictType: ConflictType
  situation: string
  onResolved: () => void
  onClose: () => void
}

function SLACountdown({ minutes }: { minutes: number }) {
  const [remaining, setRemaining] = useState(minutes * 60)

  useEffect(() => {
    const timer = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000)
    return () => clearInterval(timer)
  }, [minutes])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const isUrgent = remaining < 300 // < 5 min
  const isExpired = remaining === 0

  return (
    <div
      className={`text-sm font-mono px-3 py-1.5 rounded-lg ${
        isExpired
          ? 'bg-red-100 text-red-700'
          : isUrgent
          ? 'bg-orange-100 text-orange-700 animate-pulse'
          : 'bg-blue-50 text-blue-700'
      }`}
    >
      {isExpired ? 'SLA VYPRŠELO — fallback aktivní' : `SLA: ${mins}:${String(secs).padStart(2, '0')}`}
    </div>
  )
}

function EscalationBadge({ level }: { level: EscalationLevel }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        level === 'L1_automatic' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
      }`}
    >
      {level === 'L1_automatic' ? 'L1 Automatická' : 'L2 Manuální'}
    </span>
  )
}

export default function DecisionPanel({
  conflictId,
  conflictType,
  situation,
  onResolved,
  onClose,
}: DecisionPanelProps) {
  const { getStrategyForConflict, resolveConflict, isResolved } = useDecision()
  const { currentUser } = useRole()
  const [selectedVariant, setSelectedVariant] = useState<DecisionVariant | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const strategies = getStrategyForConflict(conflictType)
  const strategy = strategies[0] as DecisionStrategy | undefined

  if (!strategy) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
          <p className="text-gray-600">Žádná decision strategy pro tento typ konfliktu.</p>
          <button onClick={onClose} className="mt-4 text-sm text-brand-gold hover:underline">
            Zavřít
          </button>
        </div>
      </div>
    )
  }

  const alreadyResolved = isResolved(conflictId)

  function handleResolve() {
    if (!selectedVariant) {
      setError('Vyberte variantu řešení.')
      return
    }
    if (!reason.trim()) {
      setError('Zdůvodnění je povinné.')
      return
    }

    const result = resolveConflict({
      conflict_id: conflictId,
      kcs_id: strategy!.kcs_id,
      conflict_type: conflictType,
      escalation_level: strategy!.escalation_level,
      situation,
      chosen_variant_id: selectedVariant.id,
      chosen_variant_label: selectedVariant.label,
      resolved_by: currentUser.jméno,
      reason: reason.trim(),
    })

    if ('error' in result) {
      setError(result.error)
      return
    }

    console.log('telemetry: decision_resolved', result.id)
    onResolved()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-brand-dark">Rozhodovací panel</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <EscalationBadge level={strategy.escalation_level} />
            {strategy.sla_minutes && <SLACountdown minutes={strategy.sla_minutes} />}
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Guardrail info */}
          {alreadyResolved && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              Tento konflikt byl již vyřešen. Opakované řešení není povoleno (guardrail).
            </div>
          )}

          {/* Context */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Kontext situace</h3>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{situation}</p>
          </div>

          {/* Strategy info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">{strategy.label}</h3>
            {strategy.guarding_invariant && (
              <p className="text-xs text-gray-500">Guardrail: {strategy.guarding_invariant}</p>
            )}
            {strategy.fallback && (
              <p className="text-xs text-orange-600 mt-1">Fallback (po SLA): {strategy.fallback}</p>
            )}
          </div>

          {/* Variants */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Varianty řešení</h3>
            {strategy.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => !alreadyResolved && setSelectedVariant(v)}
                disabled={alreadyResolved}
                className={`w-full text-left border rounded-lg p-3 transition-colors ${
                  selectedVariant?.id === v.id
                    ? 'border-brand-gold bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${alreadyResolved ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-brand-dark">{v.label}</span>
                  <div className="flex items-center gap-2">
                    {v.recommended && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                        doporučeno
                      </span>
                    )}
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        v.risk === 'nízké'
                          ? 'bg-green-50 text-green-600'
                          : v.risk === 'střední'
                          ? 'bg-orange-50 text-orange-600'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      riziko: {v.risk}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-600">{v.action}</p>
                <p className="text-xs text-gray-400 mt-1">Dopad: {v.impact}</p>
              </button>
            ))}
          </div>

          {/* Reason */}
          {!alreadyResolved && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Zdůvodnění <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Proč jste zvolili tuto variantu..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none"
                rows={3}
              />
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{error}</div>
          )}
        </div>

        {/* Footer */}
        {!alreadyResolved && (
          <div className="sticky bottom-0 bg-white border-t px-6 py-4 rounded-b-xl flex gap-3">
            <PrimaryButton onClick={handleResolve} disabled={!selectedVariant || !reason.trim()}>
              Potvrdit rozhodnutí
            </PrimaryButton>
            <SecondaryButton onClick={onClose}>Zrušit</SecondaryButton>
          </div>
        )}
      </div>
    </div>
  )
}
