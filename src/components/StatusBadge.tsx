import type { ReservationStatus, ConflictStatus } from '../data/types'

type BadgeStatus = ReservationStatus | ConflictStatus

const statusStyles: Record<BadgeStatus, string> = {
  'vytvořena': 'bg-blue-100 text-blue-700',
  'aktivní': 'bg-green-100 text-green-700',
  'dokončena': 'bg-gray-100 text-gray-600',
  'zrušena': 'bg-red-100 text-red-600',
  'otevřený': 'bg-orange-100 text-orange-700',
  'vyřešený': 'bg-green-100 text-green-700',
}

const statusLabels: Record<BadgeStatus, string> = {
  'vytvořena': 'Vytvořena',
  'aktivní': 'Aktivní',
  'dokončena': 'Dokončena',
  'zrušena': 'Zrušena',
  'otevřený': 'Otevřený',
  'vyřešený': 'Vyřešený',
}

export default function StatusBadge({ status }: { status: BadgeStatus }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {statusLabels[status] ?? status}
    </span>
  )
}
