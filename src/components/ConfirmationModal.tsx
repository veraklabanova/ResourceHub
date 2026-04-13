import PrimaryButton from './PrimaryButton'
import SecondaryButton from './SecondaryButton'

interface ConfirmationModalProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel?: () => void
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'success' | 'danger' | 'info'
}

export default function ConfirmationModal({
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Potvrdit',
  cancelLabel = 'Zrušit',
  variant = 'info',
}: ConfirmationModalProps) {
  const iconColor = variant === 'success' ? 'text-green-500' : variant === 'danger' ? 'text-red-500' : 'text-brand-gold'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColor} bg-gray-100`}>
            {variant === 'success' ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : variant === 'danger' ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600">{message}</p>
        <div className="flex justify-end gap-3">
          {onCancel && <SecondaryButton onClick={onCancel}>{cancelLabel}</SecondaryButton>}
          <PrimaryButton onClick={onConfirm}>{confirmLabel}</PrimaryButton>
        </div>
      </div>
    </div>
  )
}
