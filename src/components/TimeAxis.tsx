import type { CSSProperties } from 'react'
import { ERA_AXIS, ERA_COLOR, ERAS, REIGNS } from '../data/rulers'
import type { EraId } from '../types'
import { AXIS_START, axisEnd, axisPercent, reignYearRange } from '../utils'

export function eraRange(id: EraId, nowYear = new Date().getFullYear()) {
  const raw = ERA_AXIS[id]
  return { start: raw.start, end: raw.end === 'now' ? nowYear : raw.end }
}

export function TimeAxis({
  activeId,
  onPickEra,
}: {
  activeId?: EraId
  onPickEra: (id: EraId) => void
}) {
  const now = new Date().getFullYear()
  const end = axisEnd(now)
  const ticks = [862, 1000, 1200, 1400, 1600, 1800, 1917, now]
  const marks = REIGNS.map((r) => {
    const span = reignYearRange(r.years, now)
    if (!span) return null
    const left = axisPercent(span.start, now)
    const width = Math.max(0.35, axisPercent(span.end, now) - left)
    return { r, left, width }
  }).filter((x): x is NonNullable<typeof x> => x !== null)

  return (
    <div className="time-axis" aria-label={`Шкала лет ${AXIS_START}–${end}`}>
      <div className="time-axis-bands">
        {ERAS.map((era) => {
          const range = eraRange(era.id, now)
          const left = axisPercent(range.start, now)
          const width = Math.max(1.2, axisPercent(range.end, now) - left)
          const short = era.id === 'ussr' ? '1918→' : era.station
          return (
            <button
              key={era.id}
              type="button"
              className={`time-axis-band${activeId === era.id ? ' is-active' : ''}`}
              style={
                {
                  left: `${left}%`,
                  width: `${width}%`,
                  '--era': ERA_COLOR[era.id],
                } as CSSProperties
              }
              onClick={() => onPickEra(era.id)}
              aria-label={`${era.station}, ${range.start}–${range.end}`}
              aria-current={activeId === era.id ? 'true' : undefined}
            >
              <span>{short}</span>
            </button>
          )
        })}
      </div>
      <div className="time-axis-marks" aria-hidden>
        {marks.map(({ r, left, width }) => (
          <i
            key={r.id}
            className="time-axis-mark"
            title={`${r.name} · ${r.years}`}
            style={
              {
                left: `${left}%`,
                width: `${width}%`,
                '--era': ERA_COLOR[r.eraId],
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="time-axis-ticks" aria-hidden>
        {ticks.map((y) => (
          <span key={y} style={{ left: `${axisPercent(y, now)}%` }}>
            {y}
          </span>
        ))}
      </div>
    </div>
  )
}
