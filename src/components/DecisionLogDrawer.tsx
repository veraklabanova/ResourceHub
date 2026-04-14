import { useState } from 'react'
import { useDecision } from '../context/DecisionContext'
import type { StrategicPattern } from '../context/DecisionContext'
import type { ChangeRequest } from '../data/types'

interface Props {
  open: boolean
  onClose: () => void
}

type Tab = 'log' | 'strategic'

const typeLabels: Record<string, string> = {
  no_show: 'No-show',
  neoprávněné_užití: 'Neoprávněné užití',
  dvojitá_rezervace: 'Dvojitá rezervace',
}

function CRPreview({ cr, onClose }: { cr: ChangeRequest; onClose: () => void }) {
  const json = JSON.stringify(cr, null, 2)
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${cr.change_id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="bg-brand-dark text-white px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-brand-gold font-semibold uppercase tracking-wide">Change Protocol v1</p>
            <p className="text-sm font-bold">{cr.change_id}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCopy} className="text-[10px] px-3 py-1 border border-brand-gold/50 text-brand-gold rounded-full hover:bg-brand-gold/10">
              {copied ? 'Zkopírováno!' : 'Kopírovat'}
            </button>
            <button onClick={handleDownload} className="text-[10px] px-3 py-1 bg-brand-gold text-brand-dark rounded-full font-semibold hover:bg-yellow-400">
              Stáhnout .json
            </button>
          </div>
        </div>
        <pre className="p-4 text-[11px] font-mono text-gray-700 overflow-auto max-h-[60vh] bg-gray-50">{json}</pre>
      </div>
    </div>
  )
}

function StrategicInsights({ patterns }: { patterns: StrategicPattern[] }) {
  const { generateChangeRequest } = useDecision()
  const [previewCR, setPreviewCR] = useState<ChangeRequest | null>(null)

  if (patterns.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12">
        <p className="text-sm">Zatím žádné patterny.</p>
        <p className="text-xs mt-1">Patterny se detekují automaticky z Decision Log.</p>
      </div>
    )
  }

  const candidates = patterns.filter((p) => p.isChangeCandidate)
  const emerging = patterns.filter((p) => !p.isChangeCandidate)

  return (
    <div className="space-y-6">
      {previewCR && <CRPreview cr={previewCR} onClose={() => setPreviewCR(null)} />}
      {candidates.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Change Candidates ({candidates.length})
          </h3>
          <div className="space-y-3">
            {candidates.map((p) => (
              <div key={p.key} className="border-2 border-red-200 bg-red-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-brand-dark">{typeLabels[p.typ] ?? p.typ}</span>
                  <div className="flex gap-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      p.počet >= 6 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {p.počet >= 6 ? 'high' : 'medium'}
                    </span>
                    <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">{p.počet}x</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  Opakovaná varianta: <strong>{p.varianta_název}</strong>
                </p>
                <div className="bg-white border border-red-200 rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wide mb-1">Doporučení pro architekta</p>
                  <p className="text-xs text-gray-800">{p.návrh}</p>
                </div>
                <div className="flex gap-2 pt-1">
                  <button className="text-[10px] bg-brand-dark text-white px-3 py-1 rounded-full hover:bg-gray-800 transition-colors">
                    Implementovat
                  </button>
                  <button className="text-[10px] border border-gray-300 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-50 transition-colors">
                    Zamítnout
                  </button>
                  <button
                    onClick={() => setPreviewCR(generateChangeRequest(p))}
                    className="text-[10px] border border-blue-300 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-50 transition-colors"
                  >
                    Exportovat CR
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {emerging.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Emerging Patterns (pod prahem)
          </h3>
          <div className="space-y-2">
            {emerging.map((p) => (
              <div key={p.key} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-brand-dark">{typeLabels[p.typ] ?? p.typ}</span>
                  <span className="text-xs text-gray-500 ml-2">→ {p.varianta_název}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${i <= p.počet ? 'bg-amber-400' : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400">{p.počet}/3</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">Pravidlo</p>
        <p className="text-xs text-blue-800 mt-1">
          Pokud se stejné rozhodnutí opakuje 3+ krát → vzniká change candidate.
          Architekt rozhodne: implementovat (systémová změna) nebo neimplementovat.
        </p>
      </div>
    </div>
  )
}

export default function DecisionLogDrawer({ open, onClose }: Props) {
  const { log, patterns, changeCandidateCount } = useDecision()
  const [tab, setTab] = useState<Tab>('log')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-brand-dark text-white px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-brand-gold font-semibold uppercase tracking-wide">Decision Layer</p>
              <h2 className="text-lg font-bold">Log & Strategic Insights</h2>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white text-xl">&times;</button>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setTab('log')}
              className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${tab === 'log' ? 'bg-white/20 text-white font-semibold' : 'text-white/60 hover:text-white'}`}
            >
              Decision Log ({log.length})
            </button>
            <button
              onClick={() => setTab('strategic')}
              className={`flex-1 text-xs py-1.5 rounded-md transition-colors relative ${tab === 'strategic' ? 'bg-white/20 text-white font-semibold' : 'text-white/60 hover:text-white'}`}
            >
              Strategic
              {changeCandidateCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {changeCandidateCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="p-4">
          {tab === 'strategic' ? (
            <StrategicInsights patterns={patterns} />
          ) : (
            <div className="space-y-4">
              {log.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <p className="text-sm">Zatím žádná rozhodnutí.</p>
                  <p className="text-xs mt-1">Rozhodnutí se zaznamenají automaticky při řešení konfliktů.</p>
                </div>
              ) : (
                [...log].reverse().map((record) => {
                  const chosen = record.varianty.find((v) => v.id === record.zvolená_varianta)
                  return (
                    <div key={record.id} className="border rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-brand-dark">{record.id}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          record.guardrail_check === 'pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          Guardrail: {record.guardrail_check === 'pass' ? 'OK' : 'FAIL'}
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-20 flex-shrink-0">Typ:</span>
                          <span className="font-medium">{typeLabels[record.typ] ?? record.typ}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-20 flex-shrink-0">Eskalace:</span>
                          <span className="font-medium">{record.eskalace}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-20 flex-shrink-0">Situace:</span>
                          <span className="text-gray-700">{record.situace}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-20 flex-shrink-0">Rozhodnutí:</span>
                          <span className="font-semibold text-brand-dark">{chosen?.název ?? '?'}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-20 flex-shrink-0">Rozhodl:</span>
                          <span>{record.rozhodl}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-20 flex-shrink-0">Proč:</span>
                          <span className="italic text-gray-600">{record.zdůvodnění}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-20 flex-shrink-0">Datum:</span>
                          <span>{new Date(record.datum).toLocaleString('cs-CZ')}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
