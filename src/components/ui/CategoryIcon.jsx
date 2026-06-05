import * as Icons from 'lucide-react'

export default function CategoryIcon({ icon, color, size = 20, className = '' }) {
  const Icon = icon ? Icons[icon] : null
  return (
    <div
      className={`flex items-center justify-center rounded-xl ${className}`}
      style={{ backgroundColor: color + '20', color }}
    >
      {Icon
        ? <Icon size={size} strokeWidth={1.8} />
        : icon
          ? <span style={{ fontSize: size * 0.88, lineHeight: 1 }}>{icon}</span>
          : <Icons.MoreHorizontal size={size} strokeWidth={1.8} />
      }
    </div>
  )
}
