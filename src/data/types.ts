export type Role = 'end_user' | 'admin'

export type ResourceType = 'zasedačka' | 'auto' | 'zařízení'

export interface Resource {
  id: string
  název: string
  typ: ResourceType
  popis: string
  aktivní: boolean
}

export type ReservationStatus = 'vytvořena' | 'aktivní' | 'dokončena' | 'zrušena'

export interface Reservation {
  id: string
  zdroj_id: string
  uživatel_id: string
  od: string // ISO datetime
  do: string // ISO datetime
  stav: ReservationStatus
  poznámka: string
}

export type ConflictType = 'no_show' | 'neoprávněné_užití' | 'dvojitá_rezervace'
export type ConflictStatus = 'otevřený' | 'čeká_na_řešení' | 'vyřešený'

export interface Conflict {
  id: string
  rezervace_id: string
  typ: ConflictType
  popis: string
  řešení: string
  stav: ConflictStatus
  vytvořeno: string // ISO datetime
}

export interface User {
  id: string
  jméno: string
  email: string
  role: Role
}

// Decision Layer types
export type EscalationLevel = 'L1_automatic' | 'L2_manual'

export interface DecisionVariant {
  id: string
  label: string
  action: string
  impact: string
  risk: 'nízké' | 'střední' | 'vysoké'
  recommended: boolean
}

export interface DecisionStrategy {
  kcs_id: string
  conflict_type: ConflictType
  label: string
  resolution_type: 'preventive_guard' | 'manual_escalation'
  sla_minutes: number | null
  fallback: string | null
  guarding_invariant: string | null
  escalation_level: EscalationLevel
  variants: DecisionVariant[]
}

export interface DecisionLogEntry {
  id: string
  conflict_id: string
  kcs_id: string
  conflict_type: ConflictType
  escalation_level: EscalationLevel
  situation: string
  chosen_variant_id: string
  chosen_variant_label: string
  resolved_by: string
  reason: string
  timestamp: string
  guardrail_check: boolean
  sla_fallback: boolean
}

export interface StrategicPattern {
  conflict_type: ConflictType
  variant_id: string
  variant_label: string
  count: number
  change_candidate: boolean
  suggested_change: string
  confidence: 'low' | 'medium' | 'high'
}

export interface ChangeProtocol {
  version: string
  context: {
    problem: string
    frequency: number
    trigger: string
    actors: string[]
  }
  proposal: {
    variants: string[]
    recommendation: string
  }
  impact: {
    scope: string
    risk: string
  }
  trace: {
    decision_refs: string[]
    kcs_id: string
  }
}
