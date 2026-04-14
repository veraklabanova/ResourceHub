import { useState } from 'react'
import { useDecision } from '../context/DecisionContext'
import type { StrategicPattern } from '../data/types'

type Tab = 'log' | 'strategic'

const conflictTypeLabels: Record<string, string> = {
  no_show: 'No-show',
  'neoprávněné_užití': 'Neoprávněné užití',
  'dvojitá_rezervace': 'Dvojitá rezervace',
}

export default function DecisionLogDrawer({ onClose }: { onClose: () => void }) {
  const { log, patterns, generateChangeProtocol } = useDecision()
  const [activeTab, setActiveTab] = useState<Tab>('log')

  function handleExportCR(pattern: StrategicPattern) {
    const protocol = generateChangeProtocol(pattern)
    const json = JSON.stringify(protocol, null, 2)

    // Try clipboard, fallback to download
    if (navigator.clipboard) {
      navigator.clipboard.writeText(json).then(() => {
        alert('Change Protocol zkopírován do schránky.')
      })
    } else {
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CR_${pattern.conflict_type}_${pattern.variant_id}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
    console.log('telemetry: change_protocol_exported', pattern)
  }

  const changeCandidates = patterns.filter((p) => p.change_candidate)

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white w-full max-w-lg h-full shadow-2xl flex flex-col animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-dark">Decision Log</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 mx-6 mt-4 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('log')}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'log' ? 'bg-white shadow text-brand-dark' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Záznamy ({log.length})
          </button>
          <button
            onClick={() => setActiveTab('strategic')}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'strategic' ? 'bg-white shadow text-brand-dark' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Strategic{changeCandidates.length > 0 && (
              <span className="ml-1 bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0.5 rounded-full">
                {changeCandidates.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {activeTab === 'log' ? (
            log.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                Zatím žádná rozhodnutí.
              </div>
            ) : (
              [...log].reverse().map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-brand-dark">{entry.id}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        entry.escalation_level === 'L1_automatic'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {entry.escalation_level === 'L1_automatic' ? 'L1' : 'L2'}
                    </span>
                  </div>
                  <div className="text-xs space-y-1 text-gray-600">
                    <p>
                      <span className="font-medium text-gray-700">Typ:</span>{' '}
                      {conflictTypeLabels[entry.conflict_type] ?? entry.conflict_type}
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Situace:</span> {entry.situation}
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Varianta:</span> {entry.chosen_variant_label}
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Rozhodl:</span> {entry.resolved_by}
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Důvod:</span> {entry.reason}
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Kdy:</span>{' '}
                      {new Date(entry.timestamp).toLocaleString('cs-CZ')}
                    </p>
                    <div className="flex gap-2 mt-1">
                      {entry.guardrail_check && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded">
                          guardrail OK
                        </span>
                      )}
                      {entry.sla_fallback && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded">
                          SLA fallback
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            /* Strategic Insights tab */
            patterns.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                Zatím nedostatek dat pro strategickou analýzu.
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">
                  Opakující se vzory rozhodnutí. Kandidáti na změnu (3+ opakování) jsou zvýrazněni.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="py-2 pr-2">Pattern</th>
                        <th className="py-2 pr-2">Počet</th>
                        <th className="py-2 pr-2">Návrh změny</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {patterns.map((p, i) => (
                        <tr
                          key={i}
                          className={`border-b ${
                            p.change_candidate ? 'bg-orange-50' : ''
                          }`}
                        >
                          <td className="py-2 pr-2">
                            <div className="font-medium text-gray-700">
                              {conflictTypeLabels[p.conflict_type] ?? p.conflict_type}
                            </div>
                            <div className="text-gray-400">{p.variant_label}</div>
                          </td>
                          <td className="py-2 pr-2">
                            <span
                              className={`font-mono font-bold ${
                                p.change_candidate ? 'text-orange-600' : 'text-gray-600'
                              }`}
                            >
                              {p.count}×
                            </span>
                          </td>
                          <td className="py-2 pr-2 text-gray-600">
                            {p.change_candidate ? (
                              <div>
                                <p>{p.suggested_change}</p>
                                <span
                                  className={`text-[10px] px-1 py-0.5 rounded mt-1 inline-block ${
                                    p.confidence === 'high'
                                      ? 'bg-green-100 text-green-700'
                                      : p.confidence === 'medium'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-gray-100 text-gray-500'
                                  }`}
                                >
                                  confidence: {p.confidence}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-2">
                            {p.change_candidate && (
                              <button
                                onClick={() => handleExportCR(p)}
                                className="text-[10px] px-2 py-1 border border-brand-gold text-brand-gold rounded hover:bg-brand-gold/10 transition-colors whitespace-nowrap"
                              >
                                Exportovat CR
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
