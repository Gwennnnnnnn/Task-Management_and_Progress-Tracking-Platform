// Initials-based avatar. Avoids external image dependencies.

export default function Avatar({ name = '', color = '#78a4cb', size = 36, image }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('')

  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.4
      }}
      title={name}
      aria-label={name}
    >
      {image ? <img src={image} alt="" /> : initials}
    </span>
  )
}
