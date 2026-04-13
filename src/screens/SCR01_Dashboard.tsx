import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../context/RoleContext'
import { getResourcesAvailability } from '../api/mockHandlers'
import type { Resource, Reservation } from '../data/types'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorToast from '../components/ErrorToast'
import StatusBadge from '../components/StatusBadge'
import SelectInput from '../components/SelectInput'
import { resources as allResources } from '../data/seedData'

const DAYS_IN_WEEK = 7
const HOURS = Array.from({ length: 12 }, (_, i) => i + 7) // 7:00 - 18:00

function getWeekDates(offset: number): Date[] {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - now.getDay() + 1 + offset * 7)
  return Array.from({ length: DAYS_IN_WEEK }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function formatDate(d: Date) {
  return d.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' })
}

function getSlotStatus(resource: Resource, date: Date, hour: number, reservations: Reservation[]): { status: 'volný' | 'obsazený'; reservation?: Reservation } {
  const slotStart = new Date(date)
  slotStart.setHours(hour, 0, 0, 0)
  const slotEnd = new Date(date)
  slotEnd.setHours(hour + 1, 0, 0, 0)

  const res = reservations.find(
    (r) =>
      r.zdroj_id === resource.id &&
      r.stav !== 'zrušena' &&
      new Date(r.od) < slotEnd &&
      new Date(r.do) > slotStart
  )

  return res ? { status: 'obsazený', reservation: res } : { status: 'volný' }
}

export default function SCR01_Dashboard() {
  const { role } = useRole()
  const navigate = useNavigate()
  const [resources, setResources] = useState<Resource[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState('')
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getResourcesAvailability(role)
      setResources(data.resources)
      setReservations(data.reservations)
    } catch {
      setError('Nepodařilo se načíst data. Zkuste obnovit stránku.')
    } finally {
      setLoading(false)
    }
  }, [role])

  useEffect(() => { load() }, [load])

  const weekDates = getWeekDates(weekOffset)
  const filtered = filterType ? resources.filter((r) => r.typ === filterType) : resources

  if (loading) return <LoadingSpinner />
  if (!loading && resources.length === 0) {
    return <div className="text-center text-gray-500 py-12">Správce zatím nepřidal žádné zdroje. Kontaktujte správce.</div>
  }

  return (
    <div className="space-y-4">
      {error && <ErrorToast message={error} onClose={() => setError(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <h1 className="text-xl font-bold text-brand-dark">Přehled dostupnosti</h1>
        <div className="w-full sm:w-48">
          <SelectInput
            label=""
            value={filterType}
            onChange={(v) => { setFilterType(v); console.log('telemetry: filter_applied', v) }}
            options={[
              { value: 'zasedačka', label: 'Zasedačky' },
              { value: 'auto', label: 'Auta' },
              { value: 'zařízení', label: 'Zařízení' },
            ]}
            placeholder="Všechny typy"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setWeekOffset((w) => w - 1)} className="px-3 py-1 rounded border text-sm hover:bg-gray-100">&larr;</button>
        <span className="text-sm font-medium">{formatDate(weekDates[0])} — {formatDate(weekDates[6])}</span>
        <button onClick={() => setWeekOffset((w) => w + 1)} className="px-3 py-1 rounded border text-sm hover:bg-gray-100">&rarr;</button>
        {weekOffset !== 0 && (
          <button onClick={() => setWeekOffset(0)} className="text-xs text-brand-gold hover:underline ml-2">Dnes</button>
        )}
      </div>

      {filtered.map((resource) => (
        <div key={resource.id} className="bg-white rounded-xl border p-3 overflow-x-auto">
          <h3 className="font-semibold text-sm mb-2 text-brand-dark">{resource.název}</h3>
          <div className="grid" style={{ gridTemplateColumns: `80px repeat(${DAYS_IN_WEEK}, 1fr)`, minWidth: 600 }}>
            <div />
            {weekDates.map((d, i) => (
              <div key={i} className="text-xs text-center text-gray-500 pb-1 font-medium">{formatDate(d)}</div>
            ))}
            {HOURS.map((hour) => (
              <div key={hour} className="contents">
                <div className="text-xs text-gray-400 pr-2 text-right py-0.5">{hour}:00</div>
                {weekDates.map((date, di) => {
                  const { status, reservation } = getSlotStatus(resource, date, hour, reservations)
                  const isFree = status === 'volný'
                  return (
                    <div
                      key={di}
                      onClick={() => {
                        if (isFree) {
                          console.log('telemetry: slot_selected', resource.id, date, hour)
                          const od = new Date(date)
                          od.setHours(hour, 0, 0, 0)
                          const doTime = new Date(date)
                          doTime.setHours(hour + 1, 0, 0, 0)
                          navigate(`/rezervace?zdroj=${resource.id}&od=${od.toISOString().slice(0, 16)}&do=${doTime.toISOString().slice(0, 16)}`)
                        } else if (reservation) {
                          console.log('telemetry: reservation_detail_viewed', reservation.id)
                          setSelectedReservation(reservation)
                        }
                      }}
                      className={`border border-gray-100 py-0.5 text-center cursor-pointer transition-colors text-[10px] ${
                        isFree
                          ? 'bg-green-50 hover:bg-green-100 text-green-600'
                          : 'bg-red-50 hover:bg-red-100 text-red-600'
                      }`}
                    >
                      {isFree ? '' : ''}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      ))}

      {selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedReservation(null)}>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm max-w-sm w-full">
            <div onClick={(e) => e.stopPropagation()} className="space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-brand-dark">Detail rezervace</h3>
                <StatusBadge status={selectedReservation.stav} />
              </div>
              <div className="text-sm space-y-1 text-gray-600">
                <p><span className="font-medium">Zdroj:</span> {allResources.find((r) => r.id === selectedReservation.zdroj_id)?.název}</p>
                <p><span className="font-medium">Od:</span> {new Date(selectedReservation.od).toLocaleString('cs-CZ')}</p>
                <p><span className="font-medium">Do:</span> {new Date(selectedReservation.do).toLocaleString('cs-CZ')}</p>
                {selectedReservation.poznámka && <p><span className="font-medium">Poznámka:</span> {selectedReservation.poznámka}</p>}
              </div>
              <button onClick={() => setSelectedReservation(null)} className="text-sm text-brand-gold hover:underline">Zavřít</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
