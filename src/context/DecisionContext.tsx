import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type {
  DecisionStrategy,
  DecisionLogEntry,
  ConflictType,
  StrategicPattern,
  ChangeProtocol,
} from '../data/types'

// ─── Decision strategies hardcoded from PA MACHINE_DATA KCS-01..KCS-04 ───
// Source: docs/PAB_Rezervace_zdroju_v1_revised.md § Known Critical Situations + § 7.1 Critical Interactions
const DECISION_STRATEGIES: DecisionStrategy[] = [
  {
    kcs_id: 'KCS-01',
    conflict_type: 'dvojitá_rezervace',
    label: 'Souběh dvou rezervací na stejný zdroj (race condition)',
    resolution_type: 'preventive_guard',
    sla_minutes: null,
    fallback: null,
    guarding_invariant: 'INV-01',
    escalation_level: 'L1_automatic',
    variants: [
      {
        id: 'kcs01-v1',
        label: 'First-come-first-served',
        action: 'Systém na úrovni backendu zamkne slot atomicky. Pozdější požadavek dostane chybu „Slot byl právě obsazen. Zobrazuji nejbližší volný."',
        impact: 'Vždy právě jedna rezervace — žádný nedeterministický stav',
        risk: 'nízké',
        recommended: true,
      },
    ],
  },
  {
    kcs_id: 'KCS-02',
    conflict_type: 'no_show',
    label: 'No-show — uživatel nepřijde na rezervaci',
    resolution_type: 'manual_escalation',
    sla_minutes: 60,
    fallback: 'Rezervace automaticky přejde do stavu no_show, zdroj se uvolní',
    guarding_invariant: 'INV-02',
    escalation_level: 'L2_manual',
    variants: [
      {
        id: 'kcs02-v1',
        label: 'Kontaktovat uživatele',
        action: 'Správce kontaktuje uživatele, zjistí důvod nepřítomnosti. Zdroj zůstane blokovaný do vyřešení.',
        impact: 'Šance na pozdní příchod, ale zdroj zůstane nepoužitý déle',
        risk: 'nízké',
        recommended: true,
      },
      {
        id: 'kcs02-v2',
        label: 'Okamžitě evidovat no-show',
        action: 'Označit jako no-show, uvolnit zdroj okamžitě. Uživatel upozorněn zpětně.',
        impact: 'Zdroj ihned k dispozici ostatním, ale uživatel neměl šanci se vysvětlit',
        risk: 'střední',
        recommended: false,
      },
    ],
  },
  {
    kcs_id: 'KCS-03',
    conflict_type: 'neoprávněné_užití',
    label: 'Neoprávněné užití — někdo používá zdroj bez rezervace',
    resolution_type: 'manual_escalation',
    sla_minutes: 30,
    fallback: 'Neoprávněný uživatel musí zdroj uvolnit, konflikt evidován',
    guarding_invariant: 'INV-03',
    escalation_level: 'L2_manual',
    variants: [
      {
        id: 'kcs03-v1',
        label: 'Předat zdroj rezervantovi',
        action: 'Neoprávněný uživatel musí zdroj uvolnit okamžitě. Konflikt evidován, zdroj předán legitimnímu rezervantovi.',
        impact: 'Rezervant získá zdroj dle plánu, neoprávněný přesunut',
        risk: 'nízké',
        recommended: true,
      },
      {
        id: 'kcs03-v2',
        label: 'Domluvit sdílení nebo posunutí',
        action: 'Pokud to povaha zdroje dovoluje, domluvit krátkodobé sdílení nebo posunutí jednoho z uživatelů.',
        impact: 'Oba uživatelé částečně spokojeni, ale zdroj omezen',
        risk: 'střední',
        recommended: false,
      },
    ],
  },
  {
    kcs_id: 'KCS-04',
    conflict_type: 'dvojitá_rezervace',
    label: 'Správce řeší přidělení — dva legitimní nároky',
    resolution_type: 'manual_escalation',
    sla_minutes: 120,
    fallback: 'Starší rezervace má přednost (first-come-first-served fallback)',
    guarding_invariant: 'INV-04',
    escalation_level: 'L2_manual',
    variants: [
      {
        id: 'kcs04-v1',
        label: 'Priorita dle naléhavosti',
        action: 'Správce posoudí naléhavost obou nároků a přidělí zdroj tomu s vyšší prioritou. Druhému nabídne alternativu.',
        impact: 'Jeden uživatel musí hledat alternativu, ale rozhodnutí je optimální',
        risk: 'střední',
        recommended: true,
      },
      {
        id: 'kcs04-v2',
        label: 'Starší rezervace vyhrává',
        action: 'Přednost má dříve vytvořená rezervace (first-come-first-served). Transparentní a deterministické.',
        impact: 'Jednoznačné pravidlo, ale nemusí být optimální pro byznys',
        risk: 'nízké',
        recommended: false,
      },
      {
        id: 'kcs04-v3',
        label: 'Alternativní zdroj nebo čas',
        action: 'Nabídnout oběma uživatelům alternativní zdroj stejného typu nebo jiný časový slot.',
        impact: 'Oba spokojeni, pokud alternativa existuje — jinak neaplikovatelné',
        risk: 'nízké',
        recommended: false,
      },
    ],
  },
]

// ─── Seed decision log entries (historical decisions for demo + strategic insights) ───
const SEED_DECISION_LOG: DecisionLogEntry[] = [
  // 3× KCS-02 no_show → varianta "Kontaktovat uživatele" → pattern detection threshold (3)
  {
    id: 'DR-001',
    conflict_id: 'c1',
    kcs_id: 'KCS-02',
    conflict_type: 'no_show',
    escalation_level: 'L2_manual',
    situation: 'Uživatel se nedostavil na rezervovanou zasedačku, ostatní čekali.',
    chosen_variant_id: 'kcs02-v1',
    chosen_variant_label: 'Kontaktovat uživatele',
    resolved_by: 'Filip Němec',
    reason: 'Uživatel měl zpoždění kvůli dopravě, omluvil se telefonicky.',
    timestamp: '2026-01-05T12:15:00.000Z',
    guardrail_check: true,
    sla_fallback: false,
  },
  {
    id: 'DR-002',
    conflict_id: 'c2',
    kcs_id: 'KCS-02',
    conflict_type: 'no_show',
    escalation_level: 'L2_manual',
    situation: 'Zasedačka blokována celé dopoledne, nikdo nepřišel.',
    chosen_variant_id: 'kcs02-v1',
    chosen_variant_label: 'Kontaktovat uživatele',
    resolved_by: 'Markéta Benešová',
    reason: 'Uživatel zapomněl zrušit — schůzka přesunuta na online. Omluva přijata.',
    timestamp: '2026-02-02T13:20:00.000Z',
    guardrail_check: true,
    sla_fallback: false,
  },
  // 2× KCS-03 neoprávněné_užití → varianta "Předat zdroj rezervantovi"
  {
    id: 'DR-003',
    conflict_id: 'c3',
    kcs_id: 'KCS-03',
    conflict_type: 'neoprávněné_užití',
    escalation_level: 'L2_manual',
    situation: 'Vůz používán osobou bez platné rezervace.',
    chosen_variant_id: 'kcs03-v1',
    chosen_variant_label: 'Předat zdroj rezervantovi',
    resolved_by: 'Filip Němec',
    reason: 'Zjevné porušení pravidel — uživatel neměl žádnou rezervaci. Přístup odebrán na 2 týdny.',
    timestamp: '2026-02-10T19:30:00.000Z',
    guardrail_check: true,
    sla_fallback: false,
  },
  {
    id: 'DR-004',
    conflict_id: 'c4',
    kcs_id: 'KCS-03',
    conflict_type: 'neoprávněné_užití',
    escalation_level: 'L2_manual',
    situation: 'Vůz vrácen pozdě, překryv s další rezervací.',
    chosen_variant_id: 'kcs03-v2',
    chosen_variant_label: 'Domluvit sdílení nebo posunutí',
    resolved_by: 'Markéta Benešová',
    reason: 'Zpoždění 45 min kvůli dopravě. Domluveno posunutí druhé rezervace o 1 hodinu.',
    timestamp: '2026-03-04T15:45:00.000Z',
    guardrail_check: true,
    sla_fallback: false,
  },
  // 1× DR z minulého no_show navíc — dostaneme 3× "Kontaktovat uživatele" pro pattern
  {
    id: 'DR-005',
    conflict_id: 'c6',
    kcs_id: 'KCS-02',
    conflict_type: 'no_show',
    escalation_level: 'L2_manual',
    situation: 'Notebook rezervován na celý den, uživatel se nedostavil a nekomunikoval.',
    chosen_variant_id: 'kcs02-v1',
    chosen_variant_label: 'Kontaktovat uživatele',
    resolved_by: 'Filip Němec',
    reason: 'Uživatel na home-office, zapomněl zrušit. Notebook uvolněn po kontaktu.',
    timestamp: '2026-03-20T10:30:00.000Z',
    guardrail_check: true,
    sla_fallback: false,
  },
]

const PATTERN_THRESHOLD = 3

interface DecisionContextValue {
  strategies: DecisionStrategy[]
  log: DecisionLogEntry[]
  patterns: StrategicPattern[]
  getStrategyForConflict: (conflictType: ConflictType) => DecisionStrategy[]
  resolveConflict: (entry: Omit<DecisionLogEntry, 'id' | 'timestamp' | 'guardrail_check' | 'sla_fallback'>) => DecisionLogEntry | { error: string }
  isResolved: (conflictId: string) => boolean
  generateChangeProtocol: (pattern: StrategicPattern) => ChangeProtocol
}

const DecisionContext = createContext<DecisionContextValue | null>(null)

export function DecisionProvider({ children }: { children: ReactNode }) {
  const [log, setLog] = useState<DecisionLogEntry[]>(SEED_DECISION_LOG)
  const [patterns, setPatterns] = useState<StrategicPattern[]>([])

  // Recalculate patterns whenever log changes (Level 2: pattern detection)
  useEffect(() => {
    const counts: Record<string, { type: ConflictType; variantId: string; variantLabel: string; count: number }> = {}
    for (const entry of log) {
      const key = `${entry.conflict_type}|${entry.chosen_variant_id}`
      if (!counts[key]) {
        counts[key] = {
          type: entry.conflict_type,
          variantId: entry.chosen_variant_id,
          variantLabel: entry.chosen_variant_label,
          count: 0,
        }
      }
      counts[key].count++
    }

    const newPatterns: StrategicPattern[] = Object.values(counts).map((c) => {
      const isCandidate = c.count >= PATTERN_THRESHOLD
      let confidence: StrategicPattern['confidence'] = 'low'
      if (c.count >= 6) confidence = 'high'
      else if (c.count >= 3) confidence = 'medium'

      return {
        conflict_type: c.type,
        variant_id: c.variantId,
        variant_label: c.variantLabel,
        count: c.count,
        change_candidate: isCandidate,
        suggested_change: isCandidate
          ? `Automatizovat rozhodnutí — přesunout z L2 na L1 (opakující se vzor: ${c.count}×)`
          : '',
        confidence,
      }
    })
    setPatterns(newPatterns)
  }, [log])

  // SLA fallback check (every 15s)
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real app, this would check pending conflicts against SLA deadlines
      // For the prototype, we just log the check
      console.log('telemetry: sla_fallback_check', new Date().toISOString())
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  const getStrategyForConflict = useCallback((conflictType: ConflictType) => {
    return DECISION_STRATEGIES.filter(
      (s) => s.conflict_type === conflictType && s.resolution_type === 'manual_escalation'
    )
  }, [])

  const isResolved = useCallback(
    (conflictId: string) => log.some((e) => e.conflict_id === conflictId),
    [log]
  )

  const resolveConflict = useCallback(
    (entry: Omit<DecisionLogEntry, 'id' | 'timestamp' | 'guardrail_check' | 'sla_fallback'>): DecisionLogEntry | { error: string } => {
      // Guardrail: prevent re-resolution
      if (isResolved(entry.conflict_id)) {
        return { error: 'Tento konflikt byl již vyřešen. Opakované řešení není povoleno (guardrail).' }
      }

      // ID continues from seed + runtime entries
      const nextId = log.length + 1
      const newEntry: DecisionLogEntry = {
        ...entry,
        id: `DR-${String(nextId).padStart(3, '0')}`,
        timestamp: new Date().toISOString(),
        guardrail_check: true,
        sla_fallback: false,
      }

      setLog((prev) => [...prev, newEntry])
      return newEntry
    },
    [log, isResolved]
  )

  const generateChangeProtocol = useCallback(
    (pattern: StrategicPattern): ChangeProtocol => {
      const relatedEntries = log.filter(
        (e) => e.conflict_type === pattern.conflict_type && e.chosen_variant_id === pattern.variant_id
      )

      return {
        version: '1.0',
        context: {
          problem: `Opakující se rozhodnutí typu "${pattern.conflict_type}" s variantou "${pattern.variant_label}"`,
          frequency: pattern.count,
          trigger: pattern.conflict_type,
          actors: [...new Set(relatedEntries.map((e) => e.resolved_by))],
        },
        proposal: {
          variants: [pattern.suggested_change],
          recommendation: pattern.suggested_change,
        },
        impact: {
          scope: 'Systémová konfigurace Decision Layer',
          risk: pattern.confidence === 'high' ? 'nízké' : 'střední',
        },
        trace: {
          decision_refs: relatedEntries.map((e) => e.id),
          kcs_id: relatedEntries[0]?.kcs_id ?? '',
        },
      }
    },
    [log]
  )

  return (
    <DecisionContext.Provider
      value={{
        strategies: DECISION_STRATEGIES,
        log,
        patterns,
        getStrategyForConflict,
        resolveConflict,
        isResolved,
        generateChangeProtocol,
      }}
    >
      {children}
    </DecisionContext.Provider>
  )
}

export function useDecision() {
  const ctx = useContext(DecisionContext)
  if (!ctx) throw new Error('useDecision must be used within DecisionProvider')
  return ctx
}
