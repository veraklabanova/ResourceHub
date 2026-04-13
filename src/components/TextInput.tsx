interface TextInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  maxLength?: number
  error?: string
  disabled?: boolean
  multiline?: boolean
}

export default function TextInput({ label, value, onChange, placeholder, required, maxLength, error, disabled, multiline }: TextInputProps) {
  const baseClass = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold transition-colors ${error ? 'border-red-400' : 'border-gray-300'} ${disabled ? 'bg-gray-100' : 'bg-white'}`

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          rows={3}
          className={baseClass}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          className={baseClass}
        />
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {maxLength && (
        <p className="text-xs text-gray-400 text-right">{value.length}/{maxLength}</p>
      )}
    </div>
  )
}
