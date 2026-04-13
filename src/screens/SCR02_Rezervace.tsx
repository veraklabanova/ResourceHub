import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useRole } from '../context/RoleContext'
import { createReservation, cancelReservation } from '../api/mockHandlers'
import { resources } from '../data/seedData'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'
import SelectInput from '../components/SelectInput'
import DateTimePicker from '../components/DateTimePicker'
import TextInput from '../components/TextInput'
import ErrorToast from '../components/ErrorToast'
import ConfirmationModal from '../components/ConfirmationModal'
import LoadingSpinner from '../components/LoadingSpinner'

export default function SCR02_Rezervace() {
  const { role, currentUser } = useRole()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const mode = params.get('id') ? 'detail' : 'create'
  const resId = params.get('id')

  const [zdrojId, setZdrojId] = useState(params.get('zdroj') || '')
  const [od, setOd] = useState(params.get('od') || '')
  const [doVal, setDoVal] = useState(params.get('do') || '')
  const [poznamka, setPoznamka] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const now = new Date().toISOString().slice(0, 16)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 14)
  const maxDateStr = maxDate.toISOString().slice(0, 16)

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!zdrojId) e.zdroj = 'Vyberte zdroj'
    if (!od) e.od = 'Vyplňte začátek'
    if (!doVal) e.do = 'Vyplňte konec'
    if (od && doVal && new Date(doVal) <= new Date(od)) e.do = 'Čas konce musí být po začátku.'
    if (od && new Date(od) < new Date()) e.od = 'Nelze rezervovat do minulosti.'
    if (od && new Date(od) > maxDate) e.od = 'Nelze rezervovat více než 14 dní dopředu.'
    if (od && doVal) {
      const diff = (new Date(doVal).getTime() - new Date(od).getTime()) / 3600000
      if (diff > 8) e.do = 'Maximální délka rezervace je 8 hodin.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setLoading(true)
    setError(null)
    try {
      await createReservation(role, currentUser.id, { zdroj_id: zdrojId, od, do: doVal, poznámka: poznamka })
      console.log('telemetry: reservation_created')
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při vytváření rezervace')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    if (!resId) return
    setLoading(true)
    try {
      await cancelReservation(role, currentUser.id, resId)
      console.log('telemetry: reservation_cancelled')
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při rušení rezervace')
    } finally {
      setLoading(false)
    }
  }

  // Pre-fill from search params
  useEffect(() => {
    if (params.get('zdroj')) setZdrojId(params.get('zdroj')!)
    if (params.get('od')) setOd(params.get('od')!)
    if (params.get('do')) setDoVal(params.get('do')!)
  }, [params])

  if (loading && !error) return <LoadingSpinner />

  if (success) {
    return (
      <ConfirmationModal
        title="Hotovo"
        message="Rezervace vytvořena!"
        variant="success"
        confirmLabel="Zpět na přehled"
        onConfirm={() => navigate('/')}
      />
    )
  }

  const activeResources = resources.filter((r) => r.aktivní)

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {error && <ErrorToast message={error} onClose={() => setError(null)} />}

      <h1 className="text-xl font-bold text-brand-dark">
        {mode === 'detail' ? 'Detail rezervace' : 'Nová rezervace'}
      </h1>

      <SelectInput
        label="Zdroj"
        value={zdrojId}
        onChange={setZdrojId}
        options={activeResources.map((r) => ({ value: r.id, label: r.název }))}
        required
        disabled={mode === 'detail'}
        error={errors.zdroj}
        placeholder="Vyberte zdroj..."
      />

      <DateTimePicker
        label="Od"
        value={od}
        onChange={setOd}
        required
        min={now}
        max={maxDateStr}
        error={errors.od}
        disabled={mode === 'detail'}
      />

      <DateTimePicker
        label="Do"
        value={doVal}
        onChange={setDoVal}
        required
        min={od || now}
        error={errors.do}
        disabled={mode === 'detail'}
      />

      <TextInput
        label="Poznámka"
        value={poznamka}
        onChange={setPoznamka}
        placeholder="Účel rezervace (volitelné)"
        maxLength={200}
        disabled={mode === 'detail'}
      />

      <div className="flex gap-3">
        {mode === 'create' ? (
          <>
            <PrimaryButton onClick={handleSubmit} disabled={loading}>
              Rezervovat
            </PrimaryButton>
            <SecondaryButton onClick={() => { console.log('telemetry: reservation_form_cancelled'); navigate('/') }}>
              Zrušit
            </SecondaryButton>
          </>
        ) : (
          <>
            <PrimaryButton onClick={handleCancel} disabled={loading} className="!bg-red-500 !text-white hover:!bg-red-600">
              Zrušit rezervaci
            </PrimaryButton>
            <SecondaryButton onClick={() => navigate('/')}>
              Zpět
            </SecondaryButton>
          </>
        )}
      </div>
    </div>
  )
}
