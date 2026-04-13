interface DataCardProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export default function DataCard({ children, onClick, className = '' }: DataCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md hover:border-brand-gold/50 transition-all' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
