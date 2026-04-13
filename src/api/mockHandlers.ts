import type { Role, Resource, Reservation, Conflict, ConflictType } from '../data/types'
import { resources as seedResources, reservations as seedReservations, conflicts as seedConflicts } from '../data/seedData'

let resources = [...seedResources]
let reservations = [...seedReservations]
let conflicts = [...seedConflicts]

const delay = () => new Promise((r) => setTimeout(r, 300))

function checkRBAC(role: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(role)
}

// GET /api/resources/availability
export async function getResourcesAvailability(role: Role) {
  await delay()
  if (!checkRBAC(role, ['end_user', 'admin'])) throw new Error('403')
  return {
    resources: resources.filter((r) => r.aktivní),
    reservations: reservations.filter((r) => r.stav !== 'zrušena'),
  }
}

// POST /api/reservations
export async function createReservation(
  role: Role,
  userId: string,
  data: { zdroj_id: string; od: string; do: string; poznámka: string }
) {
  await delay()
  if (!checkRBAC(role, ['end_user', 'admin'])) throw new Error('403')

  const from = new Date(data.od)
  const to = new Date(data.do)
  const now = new Date()

  if (to <= from) throw new Error('Čas konce musí být po začátku.')
  if (from < now) throw new Error('Nelze rezervovat do minulosti.')

  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 14)
  if (from > maxDate) throw new Error('Nelze rezervovat více než 14 dní dopředu.')

  // INV-01: check overlap
  const overlap = reservations.some(
    (r) =>
      r.zdroj_id === data.zdroj_id &&
      (r.stav === 'vytvořena' || r.stav === 'aktivní') &&
      new Date(r.od) < to &&
      new Date(r.do) > from
  )
  if (overlap) throw new Error('Slot byl právě obsazen. Zobrazuji nejbližší volný.')

  const newRes: Reservation = {
    id: `res${Date.now()}`,
    zdroj_id: data.zdroj_id,
    uživatel_id: userId,
    od: data.od,
    do: data.do,
    stav: 'vytvořena',
    poznámka: data.poznámka,
  }
  reservations = [...reservations, newRes]
  return newRes
}

// DELETE /api/reservations/:id
export async function cancelReservation(role: Role, userId: string, reservationId: string) {
  await delay()
  if (!checkRBAC(role, ['end_user', 'admin'])) throw new Error('403')

  const res = reservations.find((r) => r.id === reservationId)
  if (!res) throw new Error('Rezervace nenalezena.')

  if (role !== 'admin' && res.uživatel_id !== userId) throw new Error('403')

  reservations = reservations.map((r) =>
    r.id === reservationId ? { ...r, stav: 'zrušena' as const } : r
  )
  return { success: true }
}

// GET /api/reservations/my
export async function getMyReservations(role: Role, userId: string) {
  await delay()
  if (!checkRBAC(role, ['end_user', 'admin'])) throw new Error('403')
  return reservations.filter((r) => r.uživatel_id === userId)
}

// POST /api/conflicts
export async function createConflict(
  role: Role,
  data: { rezervace_id: string; typ: ConflictType; popis: string; řešení: string }
) {
  await delay()
  if (!checkRBAC(role, ['admin'])) throw new Error('403')

  const newConflict: Conflict = {
    id: `c${Date.now()}`,
    rezervace_id: data.rezervace_id,
    typ: data.typ,
    popis: data.popis,
    řešení: data.řešení,
    stav: data.řešení ? 'vyřešený' : 'otevřený',
    vytvořeno: new Date().toISOString(),
  }
  conflicts = [...conflicts, newConflict]
  return newConflict
}

// GET conflicts (helper for SCR-05)
export async function getConflicts(role: Role) {
  await delay()
  if (!checkRBAC(role, ['admin'])) throw new Error('403')
  return conflicts
}

// POST /api/resources
export async function createResource(role: Role, data: { název: string; typ: string; popis: string }) {
  await delay()
  if (!checkRBAC(role, ['admin'])) throw new Error('403')

  if (resources.some((r) => r.název === data.název)) {
    throw new Error('Název zdroje musí být unikátní.')
  }

  const newResource: Resource = {
    id: `r${Date.now()}`,
    název: data.název,
    typ: data.typ as Resource['typ'],
    popis: data.popis,
    aktivní: true,
  }
  resources = [...resources, newResource]
  return newResource
}

// PUT /api/resources/:id
export async function updateResource(role: Role, id: string, data: { název: string; typ: string; popis: string }) {
  await delay()
  if (!checkRBAC(role, ['admin'])) throw new Error('403')

  if (resources.some((r) => r.název === data.název && r.id !== id)) {
    throw new Error('Název zdroje musí být unikátní.')
  }

  resources = resources.map((r) =>
    r.id === id ? { ...r, název: data.název, typ: data.typ as Resource['typ'], popis: data.popis } : r
  )
  return resources.find((r) => r.id === id)!
}

// PATCH /api/resources/:id (deactivate)
export async function deactivateResource(role: Role, id: string) {
  await delay()
  if (!checkRBAC(role, ['admin'])) throw new Error('403')

  const hasActive = reservations.some(
    (r) => r.zdroj_id === id && (r.stav === 'vytvořena' || r.stav === 'aktivní')
  )
  if (hasActive) throw new Error('Zdroj má aktivní rezervace — nelze smazat.')

  resources = resources.map((r) =>
    r.id === id ? { ...r, aktivní: !r.aktivní } : r
  )
  return resources.find((r) => r.id === id)!
}

// Helper: get all resources (for selects)
export async function getAllResources(role: Role) {
  await delay()
  if (!checkRBAC(role, ['admin'])) throw new Error('403')
  return resources
}

// Helper: get all reservations (for conflict form)
export async function getAllReservations(role: Role) {
  await delay()
  if (!checkRBAC(role, ['admin'])) throw new Error('403')
  return reservations
}
