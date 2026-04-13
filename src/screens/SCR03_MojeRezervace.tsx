import { useState, useEffect, useCallback } from 'react'
import { useRole } from '../context/RoleContext'
import { getMyReservations, cancelReservation } from '../api/mockHandlers'
import type { Reservation } from '../data/types'
import { resources } from '../data/seedData'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorToast from '../components/ErrorToast'
import StatusBadge from '../components/StatusBadge'
import DataCard from '../components/DataCard'
import ConfirmationModal from '../components/ConfirmationModal'

type Tab = 'aktivní' | 'nadcházející' | 'minulé'

function categorizeTabs(reservations: Reservation[]): Record<Tab, Reservation[]> {
  const now = new Date()
  return {
    'aktivní': reservations.filter((r) => r.stav === 'aktivní'),
    'nadcházející': reservations.filter((r) => r.stav === 'vytvořena' && new Date(r.od) > now),
    'minulé': reservations.filter((r) => r.stav === 'dokončena' || r.stav === 'zrušena'),
  }
}

export default function SCR03_MojeRezervace() {
  const { role, currentUser } = useRole()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('aktivní')
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMyReservations(role, currentUser.id)
      setReservations(data)
    } catch {
      setError('Nepodařilo se načíst historii.')
    } finally {
      setLoading(false)
    }
  }, [role, currentUser.id])

  useEffect(() => { load() }, [load])

  async function handleCancel(res: Reservation) {
    try {
      await cancelReservation(role, currentUser.id, res.id)
      console.log('telemetry: reservation_cancelled', res.id)
      setCancelTarget(null)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba')
    }
  }

  const tabs = categorizeTabs(reservations)
  const tabList: Tab[] = ['aktivní', 'nadcházející', 'minulé']

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
      {cancelTarget && (
        <ConfirmationModal
          title="Zrušit rezervaci?"
          message={`Opravdu chcete zrušit rezervaci "${resources.find((r) => r.id === cancelTarget.zdroj_id)?.název}" dne ${new Date(cancelTarget.od).toLocaleDateString('cs-CZ')}?`}
          variant="danger"
          confirmLabel="Zrušit rezervaci"
          cancelLabel="Zpět"
          onConfirm={() => handleCancel(cancelTarget)}
          onCancel={() => setCancelTarget(null)}
        />
      )}

      <h1 className="text-xl font-bold text-brand-dark">Moje rezervace</h1>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabList.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
              activeTab === tab ? 'bg-white shadow text-brand-dark' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab} ({tabs[tab].length})
          </button>
        ))}
      </div>

      {tabs[activeTab].length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          {reservations.length === 0
            ? 'Zatím nemáte žádné rezervace. Přejděte na přehled a rezervujte si zdroj.'
            : `Žádné ${activeTab} rezervace.`}
        </div>
      ) : (
        <div className="space-y-3">
          {tabs[activeTab]
            .sort((a, b) => new Date(b.od).getTime() - new Date(a.od).getTime())
            .map((res) => (
              <DataCard
                key={res.id}
                onClick={() => console.log('telemetry: reservation_detail_opened', res.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-sm text-brand-dark">
                    {resources.find((r) => r.id === res.zdroj_id)?.název}
                  </h3>
                  <StatusBadge status={res.stav} />
                </div>
                <div className="text-sm text-gray-500 space-y-0.5">
                  <p>{new Date(res.od).toLocaleString('cs-CZ')} — {new Date(res.do).toLocaleString('cs-CZ')}</p>
                  {res.poznámka && <p className="text-gray-400">{res.poznámka}</p>}
                </div>
                {(res.stav === 'aktivní' || res.stav === 'vytvořena') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setCancelTarget(res)
                    }}
                    className="mt-2 text-sm text-red-500 hover:text-red-700"
                  >
                    Zrušit
                  </button>
                )}
              </DataCard>
            ))}
        </div>
      )}
    </div>
  )
}
