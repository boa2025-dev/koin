import * as Icons from 'lucide-react'

export default function CategoryIcon({ icon, color, size = 20, className = '' }) {
  const Icon = Icons[icon] ?? Icons.MoreHorizontal
  return (
    <div
      className={`flex items-center justify-center rounded-xl ${className}`}
      style={{ backgroundColor: color + '20', color }}
    >
      <Icon size={size} strokeWidth={1.8} />
    </div>
  )
}
