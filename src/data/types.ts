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

export type EscalationLevel = 'L1' | 'L2' | 'L3'

export interface DecisionVariant {
  id: string
  název: string
  akce: string
  dopad: string
  riziko: string
  doporučená: boolean
}

export interface Conflict {
  id: string
  rezervace_id: string
  typ: ConflictType
  popis: string
  řešení: string
  stav: ConflictStatus
  vytvořeno: string // ISO datetime
  eskalace?: EscalationLevel
  sla_deadline?: string // ISO datetime — kdy vyprší SLA
  varianty?: DecisionVariant[]
  rozhodl?: string // kdo rozhodl
  zdůvodnění?: string
  rozhodnuto?: string // ISO datetime
}

export interface DecisionRecord {
  id: string
  conflict_id: string
  typ: ConflictType
  situace: string
  varianty: DecisionVariant[]
  zvolená_varianta: string // variant id
  rozhodl: string
  zdůvodnění: string
  datum: string // ISO datetime
  eskalace: EscalationLevel
  guardrail_check: 'pass' | 'fail'
}

export interface User {
  id: string
  jméno: string
  email: string
  role: Role
}

// Change Protocol v1 — standardizovaný JSON kontrakt
export interface ChangeRequest {
  version: '1.0'
  change_id: string
  created_at: string
  source_system: string
  type: 'rule_change' | 'behavior_change' | 'config_change'
  title: string
  description: string
  status: 'proposed' | 'approved' | 'rejected' | 'implemented'
  confidence: 'low' | 'medium' | 'high'
  context: {
    problem: string
    frequency: number
    trigger: string
    actors: string[]
  }
  proposal: {
    summary: string
    options: { id: string; description: string; impact: string }[]
    recommended_option: string
  }
  impact: {
    scope: 'local' | 'cross-module' | 'system-wide'
    areas: string[]
    risk: 'low' | 'medium' | 'high'
  }
  decision: {
    decided_by: string | null
    decision_reason: string | null
    timestamp: string | null
  }
  trace: {
    decision_log_ids: string[]
    pattern_id: string
    related_kcs: string
  }
}
