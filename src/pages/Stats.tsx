import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../usePageTitle'
import { ReignName } from '../components/ReignName'
import { ERA_COLOR, ERAS, REIGNS, eraLabel } from '../data/rulers'
import { durationYears, pluralReigns, pluralYears, yearsDuration, yearsSum } from '../utils'

export function Stats() {
  usePageTitle('Сводка — Правители')
  const violent = REIGNS.filter((r) => r.violentDeath)
  const nicked = REIGNS.filter((r) => r.nick)
  const dated = yearsSum(REIGNS)
  const longest = [...REIGNS]
    .map((r) => ({ r, d: durationYears(r.years) ?? -1 }))
    .filter((x) => x.d >= 0)
    .sort((a, b) => b.d - a.d)
    .slice(0, 8)

  const dynasties = Object.entries(
    REIGNS.reduce<Record<string, { n: number; years: number }>>((acc, r) => {
      const key = r.dynasty || 'без указания'
      const cur = acc[key] ?? { n: 0, years: 0 }
      acc[key] = { n: cur.n + 1, years: cur.years + (durationYears(r.years) ?? 0) }
      return acc
    }, {}),
  ).sort((a, b) => b[1].n - a[1].n)

  const eraRows = ERAS.map((era) => {
    const items = REIGNS.filter((r) => r.eraId === era.id)
    return { era, n: items.length, years: yearsSum(items) }
  })
  const maxEraN = Math.max(...eraRows.map((e) => e.n))
  const maxEraY = Math.max(...eraRows.map((e) => e.years), 1)
  const maxDynN = Math.max(...dynasties.map(([, x]) => x.n))
  const maxDynY = Math.max(...dynasties.map(([, x]) => x.years), 1)

  return (
    <div className="wrap">
      <div className="page-head">
        <h1>Сводка по таблице</h1>
      </div>
      <div className="stats-grid">
        <div className="stat">
          <b>{REIGNS.length}</b>
          <span>правлений</span>
        </div>
        <div className="stat">
          <b>{dated}</b>
          <span>суммарных лет у власти</span>
        </div>
        <Link className="stat stat-link" to="/catalog?death=1">
          <b>{violent.length}</b>
          <span>насильственная смерть</span>
        </Link>
        <Link className="stat stat-link" to="/catalog?nick=1">
          <b>{nicked.length}</b>
          <span>с прозвищем</span>
        </Link>
      </div>

      <h2 className="section-h">По эпохам</h2>
      <p className="section-lead">Число сроков и сумма лет правления. Нажмите строку, чтобы открыть каталог.</p>
      {eraRows.map(({ era, n, years }) => (
        <Link
          key={era.id}
          className="stat-row"
          to={`/catalog?era=${era.id}`}
          style={{ '--era': ERA_COLOR[era.id] } as CSSProperties}
        >
          <div className="stat-row-head">
            <span>{eraLabel(era.id, era.station)}</span>
            <b>
              {pluralReigns(n)} · {years} {pluralYears(years)}
            </b>
          </div>
          <div className="bar bar-split">
            <i className="bar-count" style={{ width: `${(n / maxEraN) * 100}%` }} />
            <i className="bar-years" style={{ width: `${(years / maxEraY) * 100}%` }} />
          </div>
        </Link>
      ))}

      <h2 className="section-h">По династиям и периодам</h2>
      {dynasties.map(([name, x]) => {
        const body = (
          <>
            <div className="stat-row-head">
              <span>{name}</span>
              <b>
                {pluralReigns(x.n)} · {x.years} {pluralYears(x.years)}
              </b>
            </div>
            <div className="bar bar-split">
              <i className="bar-count" style={{ width: `${(x.n / maxDynN) * 100}%`, background: 'var(--accent)' }} />
              <i className="bar-years" style={{ width: `${(x.years / maxDynY) * 100}%` }} />
            </div>
          </>
        )
        return name === 'без указания' ? (
          <div key={name} className="stat-row is-static">
            {body}
          </div>
        ) : (
          <Link key={name} className="stat-row" to={`/catalog?dynasty=${encodeURIComponent(name)}`}>
            {body}
          </Link>
        )
      })}
      <p className="legend bar-legend">
        <span><i className="swatch swatch-count" /> число сроков</span>
        <span><i className="swatch swatch-years" /> сумма лет</span>
      </p>

      <h2 className="section-h">Самые длинные сроки</h2>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Правитель</th>
              <th>Годы</th>
              <th>Лет у власти</th>
            </tr>
          </thead>
          <tbody>
            {longest.map(({ r }) => (
              <tr key={r.id}>
                <td className="name">
                  <Link to={`/ruler/${r.id}`}>
                    <ReignName reign={r} />
                  </Link>
                </td>
                <td className="years">{r.years}</td>
                <td className="dur">{yearsDuration(r.years)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
