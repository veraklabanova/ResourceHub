interface DateTimePickerProps {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  min?: string
  max?: string
  error?: string
  disabled?: boolean
}

export default function DateTimePicker({ label, value, onChange, required, min, max, error, disabled }: DateTimePickerProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold transition-colors ${error ? 'border-red-400' : 'border-gray-300'} ${disabled ? 'bg-gray-100' : 'bg-white'}`}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
