import { ERA_AXIS, ERAS } from '../data/rulers'
import type { EraId } from '../types'
import { eraRange } from './TimeAxis'
import { AXIS_START, axisEnd } from '../utils'

const CENTURIES = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]

function centuryStart(c: number) {
  return (c - 1) * 100
}

function eraForYear(year: number, now: number): EraId | undefined {
  return ERAS.find((era) => {
    const raw = ERA_AXIS[era.id]
    const start = raw.start
    const end = raw.end === 'now' ? now : raw.end
    return year >= start && year < end
  })?.id
}

export function CenturyRail({
  activeId,
  onPickEra,
}: {
  activeId?: EraId
  onPickEra?: (id: EraId) => void
}) {
  const now = new Date().getFullYear()
  const start = AXIS_START
  const end = axisEnd(now)
  const total = end - start
  const active = activeId ? eraRange(activeId, now) : null
  const top = active ? ((Math.max(active.start, start) - start) / total) * 100 : 0
  const height = active
    ? ((Math.min(active.end, end) - Math.max(active.start, start)) / total) * 100
    : 0

  return (
    <aside className="century-rail" aria-label="Века">
      <div className="century-rail-track">
        {active ? (
          <i className="century-rail-now" style={{ top: `${top}%`, height: `${Math.max(height, 3)}%` }} />
        ) : null}
        {CENTURIES.map((c) => {
          const y = Math.max(start, centuryStart(c))
          if (y > end) return null
          const t = ((y - start) / total) * 100
          const eraId = eraForYear(y + 10, now)
          return (
            <button
              key={c}
              type="button"
              className="century-rail-tick"
              style={{ top: `${t}%` }}
              onClick={() => eraId && onPickEra?.(eraId)}
            >
              {c}
            </button>
          )
        })}
      </div>
    </aside>
  )
}
