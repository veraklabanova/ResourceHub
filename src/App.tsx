import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { RoleProvider, useRole } from './context/RoleContext'
import SCR01_Dashboard from './screens/SCR01_Dashboard'
import SCR02_Rezervace from './screens/SCR02_Rezervace'
import SCR03_MojeRezervace from './screens/SCR03_MojeRezervace'
import SCR04_SpravaZdroju from './screens/SCR04_SpravaZdroju'
import SCR05_EvidenceKonfliktu from './screens/SCR05_EvidenceKonfliktu'
import DemoWalkthrough from './tour/DemoWalkthrough'
import type { Role } from './data/types'

function NDAModal({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-brand-dark/95 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-6 text-center">
        <img src="/logo.svg" alt="ResourceHub" className="h-16 mx-auto" />
        <p className="text-gray-600 leading-relaxed text-sm">
          Vítejte v interaktivním prototypu projektu ResourceHub. Z důvodu NDA jsou data anonymizována.
          Využijte přepínač v pravém horním rohu a vyzkoušejte si celý průchod aplikací pod různými uživatelskými rolemi.
        </p>
        <button
          onClick={onAccept}
          className="w-full px-6 py-3 bg-brand-gold text-brand-dark font-bold rounded-lg hover:bg-yellow-400 transition-colors"
        >
          Spustit prototyp
        </button>
      </div>
    </div>
  )
}

function PreviewPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8 space-y-8">
      <h1 className="text-2xl font-bold text-brand-dark text-center">Náhled — Responsivní zobrazení</h1>
      <div className="flex flex-col lg:flex-row gap-8 justify-center items-start">
        <div className="space-y-2 text-center">
          <h2 className="font-semibold text-gray-700">Mobil (375px)</h2>
          <iframe src="/" width={375} height={667} className="border-4 border-gray-800 rounded-2xl shadow-lg bg-white" title="Mobile preview" />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="font-semibold text-gray-700">Tablet (768px)</h2>
          <iframe src="/" width={768} height={1024} className="border-4 border-gray-800 rounded-2xl shadow-lg bg-white" title="Tablet preview" />
        </div>
      </div>
    </div>
  )
}

const navItems = [
  { to: '/', label: 'Přehled', roles: ['end_user', 'admin'] as Role[] },
  { to: '/moje-rezervace', label: 'Moje rezervace', roles: ['end_user', 'admin'] as Role[] },
  { to: '/sprava-zdroju', label: 'Správa zdrojů', roles: ['admin'] as Role[] },
  { to: '/evidence-konfliktu', label: 'Konflikty', roles: ['admin'] as Role[] },
]

function AppLayout() {
  const { role, setRole } = useRole()
  const [showTour, setShowTour] = useState(false)
  const [ndaAccepted, setNdaAccepted] = useState(() => sessionStorage.getItem('nda') === '1')
  const location = useLocation()

  useEffect(() => {
    if (ndaAccepted) sessionStorage.setItem('nda', '1')
  }, [ndaAccepted])

  if (location.pathname === '/preview') return <PreviewPage />

  if (!ndaAccepted) return <NDAModal onAccept={() => setNdaAccepted(true)} />

  const filteredNav = navItems.filter((n) => n.roles.includes(role))

  return (
    <div className="min-h-screen bg-gray-50">
      {showTour && <DemoWalkthrough onClose={() => setShowTour(false)} />}

      {/* Header */}
      <header className="bg-brand-dark text-white sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-bold tracking-wide text-brand-gold">ResourceHub</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTour(true)}
              className="text-xs px-3 py-1 border border-brand-gold/50 text-brand-gold rounded-full hover:bg-brand-gold/10 transition-colors"
            >
              Demo průchod
            </button>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="text-xs bg-white/10 border border-white/20 text-white rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-gold"
            >
              <option value="end_user" className="text-gray-900">Uživatel</option>
              <option value="admin" className="text-gray-900">Správce</option>
            </select>
          </div>
        </div>

        {/* Nav */}
        <nav className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto pb-2">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  isActive ? 'bg-brand-gold text-brand-dark font-semibold' : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<SCR01_Dashboard />} />
          <Route path="/rezervace" element={<SCR02_Rezervace />} />
          <Route path="/moje-rezervace" element={<SCR03_MojeRezervace />} />
          {role === 'admin' && (
            <>
              <Route path="/sprava-zdroju" element={<SCR04_SpravaZdroju />} />
              <Route path="/evidence-konfliktu" element={<SCR05_EvidenceKonfliktu />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <RoleProvider>
      <Routes>
        <Route path="/preview" element={<PreviewPage />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </RoleProvider>
  )
}
