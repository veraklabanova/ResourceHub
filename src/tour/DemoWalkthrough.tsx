import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../context/RoleContext'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'

interface Step {
  id: string
  title: string
  description: string
  route: string
  requiredRole?: 'admin'
}

const steps: Step[] = [
  {
    id: 'SC-01.1',
    title: 'Zobrazení dostupnosti',
    description: 'Prohlédněte si kalendářový přehled dostupnosti všech zdrojů. Zelené sloty jsou volné, červené obsazené. Kliknutím na volný slot přejdete na formulář rezervace.',
    route: '/',
  },
  {
    id: 'SC-02.1',
    title: 'Vytvoření rezervace',
    description: 'Vyplňte formulář pro novou rezervaci — vyberte zdroj, nastavte čas a odešlete. Systém automaticky ověří dostupnost.',
    route: '/rezervace',
  },
  {
    id: 'SC-03.1',
    title: 'Zrušení rezervace',
    description: 'V seznamu vlastních rezervací můžete zrušit aktivní nebo nadcházející rezervaci. Klikněte na „Zrušit" u příslušné položky.',
    route: '/moje-rezervace',
  },
  {
    id: 'SC-04.1',
    title: 'Evidence no-show',
    description: 'Jako správce můžete evidovat konflikty — například no-show, kdy se uživatel nedostavil na rezervaci. Vyplňte formulář a evidujte.',
    route: '/evidence-konfliktu',
    requiredRole: 'admin',
  },
  {
    id: 'SC-05.1',
    title: 'Přidání zdroje',
    description: 'Jako správce můžete přidávat nové zdroje (zasedačky, auta, zařízení). Klikněte na „Přidat zdroj" a vyplňte formulář.',
    route: '/sprava-zdroju',
    requiredRole: 'admin',
  },
]

interface DemoWalkthroughProps {
  onClose: () => void
}

export default function DemoWalkthrough({ onClose }: DemoWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const navigate = useNavigate()
  const { role, setRole } = useRole()

  const step = steps[currentStep]
  const isLast = currentStep === steps.length - 1

  function handleNext() {
    if (isLast) {
      onClose()
      return
    }
    const nextStep = steps[currentStep + 1]
    if (nextStep.requiredRole === 'admin' && role !== 'admin') {
      setRole('admin')
    }
    setCurrentStep((s) => s + 1)
    navigate(nextStep.route)
  }

  function handlePrev() {
    if (currentStep === 0) return
    const prevStep = steps[currentStep - 1]
    setCurrentStep((s) => s - 1)
    navigate(prevStep.route)
  }

  // Navigate to current step's route on mount
  function handleStart() {
    navigate(step.route)
  }

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 pointer-events-auto">
        <div className="bg-brand-dark text-white rounded-xl shadow-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-brand-gold font-medium">
              Krok {currentStep + 1} / {steps.length}
            </span>
            <button onClick={onClose} className="text-white/60 hover:text-white text-sm">
              Zavřít tour
            </button>
          </div>

          <h3 className="text-lg font-bold text-brand-gold">{step.title}</h3>
          <p className="text-sm text-gray-300 leading-relaxed">{step.description}</p>

          {step.requiredRole === 'admin' && role !== 'admin' && (
            <p className="text-xs text-orange-300">Tato obrazovka vyžaduje roli Správce — bude přepnuta automaticky.</p>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i === currentStep ? 'bg-brand-gold' : 'bg-white/20'}`} />
              ))}
            </div>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <SecondaryButton onClick={handlePrev} className="!text-white !border-white/30 hover:!bg-white/10">
                  Zpět
                </SecondaryButton>
              )}
              {currentStep === 0 ? (
                <PrimaryButton onClick={() => { handleStart(); handleNext() }}>
                  Začít
                </PrimaryButton>
              ) : (
                <PrimaryButton onClick={handleNext}>
                  {isLast ? 'Dokončit' : 'Další'}
                </PrimaryButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
