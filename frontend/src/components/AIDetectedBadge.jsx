// "New" badge used to mark newly created / auto-added tasks.
// (Tasks are auto-added in the background; the user-facing label is simply "New".)

import { IconSparkle } from './Icons.jsx'

export default function AIDetectedBadge({ size = 'sm' }) {
  return (
    <span className={`new-badge ${size === 'xs' ? 'new-badge-xs' : ''}`}>
      <IconSparkle size={size === 'xs' ? 11 : 13} />
      New
    </span>
  )
}
