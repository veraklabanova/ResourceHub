import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { DecisionRecord, DecisionVariant, Conflict, EscalationLevel, ConflictType, ChangeRequest } from '../data/types'

export interface StrategicPattern {
  key: string // "typ:varianta_id"
  typ: ConflictType
  varianta_název: string
  počet: number
  isChangeCandidate: boolean // >= PATTERN_THRESHOLD
  návrh: string
}

const PATTERN_THRESHOLD = 3

interface DecisionContextValue {
  log: DecisionRecord[]
  pendingCount: number
  patterns: StrategicPattern[]
  changeCandidateCount: number
  addRecord: (record: Omit<DecisionRecord, 'id' | 'datum'>) => DecisionRecord
  getVariantsForType: (typ: ConflictType) => DecisionVariant[]
  getEscalationLevel: (typ: ConflictType) => EscalationLevel
  getSlaMinutes: (typ: ConflictType) => number
  checkGuardrail: (conflict: Conflict, variantId: string) => { pass: boolean; reason?: string }
  generateChangeRequest: (pattern: StrategicPattern) => ChangeRequest
}

const DecisionContext = createContext<DecisionContextValue | null>(null)

// Decision strategies from PA MACHINE_DATA — hardcoded for prototype
const DECISION_STRATEGIES: Record<ConflictType, {
  escalation: EscalationLevel
  sla_minutes: number
  fallback: string
  guarding_invariant: string
  variants: DecisionVariant[]
}> = {
  no_show: {
    escalation: 'L2',
    sla_minutes: 60,
    fallback: 'Rezervace automaticky přejde do stavu no_show, zdroj se uvolní.',
    guarding_invariant: 'INV-02: Žádná rezervace nesmí blokovat zdroj bez fyzické přítomnosti déle než je tolerance.',
    variants: [
      { id: 'ns-1', název: 'Uvolnit zdroj', akce: 'Rezervace → no_show, zdroj ihned k dispozici.', dopad: 'Uživatel ztrácí slot, zdroj je volný pro ostatní.', riziko: 'Uživatel může přijít pozdě.', doporučená: true },
      { id: 'ns-2', název: 'Prodloužit čekání', akce: 'Ponechat rezervaci aktivní dalších 30 min.', dopad: 'Zdroj zůstává blokovaný.', riziko: 'Blokace zdroje pro ostatní.', doporučená: false },
      { id: 'ns-3', název: 'Kontaktovat uživatele', akce: 'Odeslat notifikaci, čekat na odpověď (max 15 min).', dopad: 'Krátká prodleva, ale informované rozhodnutí.', riziko: 'Uživatel neodpoví → stejně nutné rozhodnout.', doporučená: false },
    ],
  },
  neoprávněné_užití: {
    escalation: 'L2',
    sla_minutes: 30,
    fallback: 'Neoprávněný uživatel musí zdroj uvolnit, konflikt evidován.',
    guarding_invariant: 'INV-03: Zdroj smí být v daný okamžik využíván pouze osobou s platnou rezervací.',
    variants: [
      { id: 'nu-1', název: 'Okamžité uvolnění', akce: 'Neoprávněný uživatel musí zdroj ihned uvolnit.', dopad: 'Právoplatný rezervující dostane zdroj.', riziko: 'Konflikt s neoprávněným uživatelem.', doporučená: true },
      { id: 'nu-2', název: 'Dohoda o sdílení', akce: 'Pokud právoplatný souhlasí, sdílet zdroj.', dopad: 'Oba spokojeni, ale pravidlo oslabeno.', riziko: 'Precedent pro ignorování rezervací.', doporučená: false },
      { id: 'nu-3', název: 'Eskalace na vedení', akce: 'Předat rozhodnutí nadřízenému obou stran.', dopad: 'Formální řešení, pomalejší.', riziko: 'Zpoždění, zdroj zůstává sporný.', doporučená: false },
    ],
  },
  dvojitá_rezervace: {
    escalation: 'L2',
    sla_minutes: 120,
    fallback: 'Starší rezervace má přednost (first-come-first-served fallback).',
    guarding_invariant: 'INV-04: Správce je povinnen konflikt vyřešit, systém nesmí jednu stranu tiše zvýhodnit.',
    variants: [
      { id: 'dr-1', název: 'Přednost starší rezervace', akce: 'First-come-first-served — kdo rezervoval dříve, má přednost.', dopad: 'Jasné pravidlo, druhý musí najít alternativu.', riziko: 'Druhý uživatel nespokojený.', doporučená: true },
      { id: 'dr-2', název: 'Přednost dle priority', akce: 'Správce posoudí důležitost účelu (např. klient > interní).', dopad: 'Spravedlivější, ale subjektivní.', riziko: 'Obtížné zdůvodnit pravidlo.', doporučená: false },
      { id: 'dr-3', název: 'Nabídnout alternativu', akce: 'Najít náhradní zdroj nebo čas pro jednoho z nich.', dopad: 'Oba spokojeni, pokud alternativa existuje.', riziko: 'Alternativa nemusí existovat.', doporučená: false },
    ],
  },
}

// Strategic Layer: generate change proposal based on pattern
function generateProposal(typ: ConflictType, variantId: string): string {
  const proposals: Record<string, string> = {
    'no_show:ns-1': 'Automatizovat: auto-uvolnění zdroje po 15 min bez příchodu (přesun z L2 na L1).',
    'no_show:ns-3': 'Zavést automatickou notifikaci 10 min před začátkem rezervace.',
    'neoprávněné_užití:nu-1': 'Implementovat fyzickou kontrolu (QR kód / NFC) při vstupu.',
    'neoprávněné_užití:nu-3': 'Definovat eskalační politiku — po 2. incidentu automatický ban.',
    'dvojitá_rezervace:dr-1': 'Zpřísnit overlap detekci — přidat buffer 5 min mezi rezervacemi.',
    'dvojitá_rezervace:dr-3': 'Přidat automatický návrh alternativního slotu při detekci konfliktu.',
  }
  return proposals[`${typ}:${variantId}`] ?? `Zvážit automatizaci rozhodnutí pro tento pattern (přesun z L2 na L1).`
}

// Seed historical decisions for demo (Level 2 needs data to show patterns)
const SEED_LOG: DecisionRecord[] = [
  { id: 'DR-001', conflict_id: 'c1', typ: 'no_show', situace: 'Uživatel se nedostavil na zasedačku.', varianty: DECISION_STRATEGIES.no_show.variants, zvolená_varianta: 'ns-1', rozhodl: 'Filip Němec', zdůvodnění: 'Uživatel nekomunikoval.', datum: '2026-01-05T12:45:00', eskalace: 'L2', guardrail_check: 'pass' },
  { id: 'DR-002', conflict_id: 'c2', typ: 'no_show', situace: 'Zasedačka blokována celé dopoledne.', varianty: DECISION_STRATEGIES.no_show.variants, zvolená_varianta: 'ns-1', rozhodl: 'Markéta Benešová', zdůvodnění: 'Opakovaný problém, uvolnění je správný postup.', datum: '2026-02-02T13:30:00', eskalace: 'L2', guardrail_check: 'pass' },
  { id: 'DR-003', conflict_id: 'c3', typ: 'neoprávněné_užití', situace: 'Vůz používán bez rezervace.', varianty: DECISION_STRATEGIES.neoprávněné_užití.variants, zvolená_varianta: 'nu-1', rozhodl: 'Filip Němec', zdůvodnění: 'Opakované porušení pravidel.', datum: '2026-02-10T19:20:00', eskalace: 'L2', guardrail_check: 'pass' },
  { id: 'DR-004', conflict_id: 'c4', typ: 'neoprávněné_užití', situace: 'Vůz vrácen pozdě.', varianty: DECISION_STRATEGIES.neoprávněné_užití.variants, zvolená_varianta: 'nu-1', rozhodl: 'Markéta Benešová', zdůvodnění: 'Právoplatný uživatel čekal.', datum: '2026-03-04T15:25:00', eskalace: 'L2', guardrail_check: 'pass' },
]

export function DecisionProvider({ children }: { children: ReactNode }) {
  const [log, setLog] = useState<DecisionRecord[]>(SEED_LOG)

  const addRecord = useCallback((record: Omit<DecisionRecord, 'id' | 'datum'>) => {
    const newRecord: DecisionRecord = {
      ...record,
      id: `DR-${String(log.length + 1).padStart(3, '0')}`,
      datum: new Date().toISOString(),
    }
    setLog((prev) => [...prev, newRecord])
    return newRecord
  }, [log.length])

  const getVariantsForType = useCallback((typ: ConflictType) => {
    return DECISION_STRATEGIES[typ]?.variants ?? []
  }, [])

  const getEscalationLevel = useCallback((typ: ConflictType) => {
    return DECISION_STRATEGIES[typ]?.escalation ?? 'L2'
  }, [])

  const getSlaMinutes = useCallback((typ: ConflictType) => {
    return DECISION_STRATEGIES[typ]?.sla_minutes ?? 60
  }, [])

  const checkGuardrail = useCallback((_conflict: Conflict, _variantId: string) => {
    // Guardrail: no silent overwrite — if conflict already resolved, block
    if (_conflict.stav === 'vyřešený') {
      return { pass: false, reason: 'Konflikt je již vyřešen. Změna rozhodnutí vyžaduje korekční záznam.' }
    }
    return { pass: true }
  }, [])

  const pendingCount = 0

  // Level 2: Pattern detection — count decisions per typ+variant
  const patterns = useMemo<StrategicPattern[]>(() => {
    const counts: Record<string, { typ: ConflictType; varianta_id: string; varianta_název: string; count: number }> = {}
    for (const record of log) {
      const key = `${record.typ}:${record.zvolená_varianta}`
      if (!counts[key]) {
        const variant = record.varianty.find((v) => v.id === record.zvolená_varianta)
        counts[key] = { typ: record.typ, varianta_id: record.zvolená_varianta, varianta_název: variant?.název ?? '?', count: 0 }
      }
      counts[key].count++
    }
    return Object.entries(counts)
      .map(([key, val]) => ({
        key,
        typ: val.typ,
        varianta_název: val.varianta_název,
        počet: val.count,
        isChangeCandidate: val.count >= PATTERN_THRESHOLD,
        návrh: generateProposal(val.typ, val.varianta_id),
      }))
      .sort((a, b) => b.počet - a.počet)
  }, [log])

  const changeCandidateCount = patterns.filter((p) => p.isChangeCandidate).length

  // Change Protocol v1: generate CR JSON from a pattern
  const generateChangeRequest = useCallback((pattern: StrategicPattern): ChangeRequest => {
    const strategy = DECISION_STRATEGIES[pattern.typ]
    const relatedDRs = log.filter((r) => `${r.typ}:${r.zvolená_varianta}` === pattern.key).map((r) => r.id)
    const kcsMap: Record<ConflictType, string> = { no_show: 'KCS-02', neoprávněné_užití: 'KCS-03', dvojitá_rezervace: 'KCS-04' }
    const typeMap: Record<ConflictType, string> = { no_show: 'No-show', neoprávněné_užití: 'Neoprávněné užití', dvojitá_rezervace: 'Dvojitá rezervace' }
    const confidence = pattern.počet >= 6 ? 'high' : pattern.počet >= 3 ? 'medium' : 'low' as const

    return {
      version: '1.0',
      change_id: `CR-${new Date().getFullYear()}-${String(patterns.indexOf(pattern) + 1).padStart(3, '0')}`,
      created_at: new Date().toISOString(),
      source_system: 'ResourceHub',
      type: 'rule_change',
      title: `Automatizace: ${typeMap[pattern.typ]} → "${pattern.varianta_název}"`,
      description: pattern.návrh,
      status: 'proposed',
      confidence,
      context: {
        problem: `Opakované manuální rozhodování o typu "${typeMap[pattern.typ]}" se stejným výsledkem.`,
        frequency: pattern.počet,
        trigger: `Vznik konfliktu typu ${pattern.typ}`,
        actors: ['admin'],
      },
      proposal: {
        summary: pattern.návrh,
        options: strategy.variants.map((v) => ({ id: v.id, description: v.název, impact: v.dopad })),
        recommended_option: strategy.variants.find((v) => v.doporučená)?.id ?? strategy.variants[0].id,
      },
      impact: {
        scope: 'local',
        areas: ['conflict_resolution', pattern.typ],
        risk: 'low',
      },
      decision: { decided_by: null, decision_reason: null, timestamp: null },
      trace: {
        decision_log_ids: relatedDRs,
        pattern_id: `PAT-${pattern.key.replace(':', '-')}`,
        related_kcs: kcsMap[pattern.typ] ?? '',
      },
    }
  }, [log, patterns])

  return (
    <DecisionContext.Provider value={{ log, pendingCount, patterns, changeCandidateCount, addRecord, getVariantsForType, getEscalationLevel, getSlaMinutes, checkGuardrail, generateChangeRequest }}>
      {children}
    </DecisionContext.Provider>
  )
}

export function useDecision() {
  const ctx = useContext(DecisionContext)
  if (!ctx) throw new Error('useDecision must be used within DecisionProvider')
  return ctx
}

export { DECISION_STRATEGIES }
