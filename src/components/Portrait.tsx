import { useState } from 'react'
import type { PersonProfile } from '../types'

function initials(name: string): string {
  const parts = name.replace(/[«»]/g, '').split(/\s+/).filter(Boolean)
  const letters = parts.map((w) => w[0]).filter((c) => /[A-ZА-ЯЁ]/i.test(c)).slice(0, 2)
  return letters.join('').toUpperCase() || '?'
}

export function Portrait({
  profile,
  name,
  compact,
  tile,
  hideEmpty,
}: {
  profile?: PersonProfile
  name: string
  compact?: boolean
  tile?: boolean
  hideEmpty?: boolean
}) {
  const pic = profile?.portrait
  const [failed, setFailed] = useState(false)
  if (compact || tile) {
    const cls = tile ? 'thumb thumb-tile' : 'thumb'
    if (!pic || failed) {
      if (hideEmpty && !tile) return null
      if (tile) {
        return (
          <span className={`${cls} thumb-empty`} aria-hidden>
            {initials(name)}
          </span>
        )
      }
      return <span className="thumb thumb-empty" aria-hidden />
    }
    return <img className={cls} src={pic.src} alt="" onError={() => setFailed(true)} />
  }
  if (!pic || failed) {
    return (
      <div className="portrait-fallback" aria-hidden>
        {initials(name)}
      </div>
    )
  }
  return (
    <figure className="portrait">
      <img src={pic.src} alt={pic.alt} onError={() => setFailed(true)} />
      <figcaption>
        {pic.kind === 'later' ? <b>Позднее изображение. </b> : null}
        {pic.credit}
      </figcaption>
    </figure>
  )
}
