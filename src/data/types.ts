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
export type ConflictStatus = 'otevřený' | 'vyřešený'

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
