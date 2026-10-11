import { useMemo, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LifeText, ReignName } from '../components/ReignName'
import { Portrait } from '../components/Portrait'
import { profileByKey } from '../data/profiles'
import { DYNASTIES, ERA_COLOR, ERAS, REIGNS, SEARCH_HINTS, eraById, eraLabel } from '../data/rulers'
import type { EraId } from '../types'
import { usePageTitle } from '../usePageTitle'
import { csvEscape, downloadCsv, durationYears, reignYearRange, searchText, yearsDuration } from '../utils'

type SortKey = 'order' | 'years' | 'duration' | 'name'
type ViewKey = 'table' | 'cards'

function sortRows(rows: typeof REIGNS, sort: SortKey) {
  const copy = [...rows]
  if (sort === 'name') return copy.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  if (sort === 'duration') {
    return copy.sort((a, b) => (durationYears(b.years) ?? -1) - (durationYears(a.years) ?? -1))
  }
  if (sort === 'years') {
    return copy.sort(
      (a, b) => (reignYearRange(a.years)?.start ?? 9999) - (reignYearRange(b.years)?.start ?? 9999),
    )
  }
  return copy
}

export function Catalog() {
  usePageTitle('Каталог — Правители')
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const era = params.get('era') ?? ''
  const dynasty = params.get('dynasty') ?? ''
  const death = params.get('death') === '1'
  const nick = params.get('nick') === '1'
  const sort = ((params.get('sort') as SortKey) || 'order') as SortKey
  const viewParam = params.get('view')
  const view: ViewKey =
    viewParam === 'cards' || viewParam === 'table'
      ? viewParam
      : typeof window !== 'undefined' && window.innerWidth <= 560
        ? 'cards'
        : 'table'

  function set(key: string, value: string | boolean) {
    const next = new URLSearchParams(params)
    const v = typeof value === 'boolean' ? (value ? '1' : '') : value
    if (!v || (key === 'sort' && v === 'order')) next.delete(key)
    else next.set(key, v)
    setParams(next, { replace: true })
  }

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    const filtered = REIGNS.filter((r) => {
      if (s && !searchText(r).includes(s)) return false
      if (era && r.eraId !== era) return false
      if (dynasty && r.dynasty !== dynasty) return false
      if (death && !r.violentDeath) return false
      if (nick && !r.nick) return false
      return true
    })
    return sortRows(filtered, ['order', 'years', 'duration', 'name'].includes(sort) ? sort : 'order')
  }, [q, era, dynasty, death, nick, sort])

  const chips = [
    q ? { key: 'q', label: `запрос «${q}»` } : null,
    era ? { key: 'era', label: eraLabel(era as EraId) } : null,
    dynasty ? { key: 'dynasty', label: dynasty } : null,
    death ? { key: 'death', label: 'насильственная смерть' } : null,
    nick ? { key: 'nick', label: 'есть прозвище' } : null,
  ].filter((x): x is { key: string; label: string } => Boolean(x))

  function exportCsv() {
    const out = ['Эпоха;Годы правления;Лет у власти;Правитель;Прозвище;Происхождение/примечание;Годы жизни']
    for (const r of rows) {
      out.push(
        [eraById(r.eraId).station, r.years, yearsDuration(r.years), r.name, r.nick ?? '', r.origin ?? '', r.life]
          .map(csvEscape)
          .join(';'),
      )
    }
    downloadCsv(out)
  }

  return (
    <div className="wrap">
      <div className="page-head">
        <h1>Каталог правителей</h1>
        <p>Поиск в шапке. Здесь — фильтры, сортировка и два вида списка.</p>
      </div>
      <div className="toolbar">
        <span className="count" role="status" aria-live="polite">
          Показано: <b>{rows.length}</b> из {REIGNS.length}
        </span>
        <label className="sort">
          <span className="sort-label">Сортировка</span>
          <select value={sort} onChange={(e) => set('sort', e.target.value)} aria-label="Сортировка">
            <option value="order">как в летописи</option>
            <option value="years">по началу правления</option>
            <option value="duration">по длительности</option>
            <option value="name">по имени</option>
          </select>
        </label>
        <button
          className="btn"
          type="button"
          onClick={() => set('view', view === 'table' ? 'cards' : 'table')}
          aria-pressed={view === 'cards'}
        >
          {view === 'table' ? 'Карточки' : 'Таблица'}
        </button>
        <button className="btn" type="button" onClick={exportCsv}>
          Скачать CSV
        </button>
      </div>
      <div className="filters" role="group" aria-label="Фильтры">
        <select value={era} onChange={(e) => set('era', e.target.value)} aria-label="Эпоха">
          <option value="">Все эпохи</option>
          {ERAS.map((e) => (
            <option key={e.id} value={e.id}>
              {eraLabel(e.id, e.station)}
            </option>
          ))}
        </select>
        <select value={dynasty} onChange={(e) => set('dynasty', e.target.value)} aria-label="Династия">
          <option value="">Все династии и периоды</option>
          {DYNASTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <label className="check">
          <input type="checkbox" checked={death} onChange={(e) => set('death', e.target.checked)} />
          насильственная смерть
        </label>
        <label className="check">
          <input type="checkbox" checked={nick} onChange={(e) => set('nick', e.target.checked)} />
          есть прозвище
        </label>
      </div>
      {chips.length ? (
        <div className="filter-chips" aria-label="Активные фильтры">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              className="chip chip-dismiss"
              onClick={() => set(c.key, '')}
              aria-label={`Снять фильтр: ${c.label}`}
            >
              {c.label}
              <span aria-hidden>×</span>
            </button>
          ))}
          {chips.length > 1 ? (
            <button
              type="button"
              className="chip"
              onClick={() => {
                const next = new URLSearchParams()
                if (params.get('view')) next.set('view', params.get('view')!)
                if (params.get('sort')) next.set('sort', params.get('sort')!)
                setParams(next, { replace: true })
              }}
            >
              сбросить всё
            </button>
          ) : null}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="empty" role="status">
          <p>Ничего не найдено. Попробуйте:</p>
          <div className="suggests">
            {SEARCH_HINTS.map((h) =>
              h.to ? (
                <Link key={h.label} className="chip" to={h.to}>
                  {h.label}
                </Link>
              ) : (
                <button key={h.label} type="button" className="chip" onClick={() => set('q', h.q ?? h.label)}>
                  {h.label}
                </button>
              ),
            )}
            {chips.length ? (
              <button type="button" className="chip" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                сбросить фильтры
              </button>
            ) : null}
          </div>
        </div>
      ) : view === 'cards' ? (
        <div className="card-grid">
          {rows.map((r) => (
            <Link
              key={r.id}
              to={`/ruler/${r.id}`}
              className="card-tile"
              style={{ '--era': ERA_COLOR[r.eraId] } as CSSProperties}
            >
              <Portrait profile={profileByKey(r.personKey)} name={r.name} tile />
              <span className="card-tile-body">
                <span className="years">{r.years}</span>
                <h3>
                  <ReignName reign={r} />
                </h3>
                <span className="card-tile-era">{eraLabel(r.eraId, eraById(r.eraId).station)}</span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>№</th>
                <th>Годы правления</th>
                <th>Лет у власти</th>
                <th>Правитель</th>
                <th>Годы жизни</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const n = REIGNS.indexOf(r) + 1
                return (
                  <tr key={r.id}>
                    <td className="num">{n}</td>
                    <td className="years">{r.years}</td>
                    <td className="dur">{yearsDuration(r.years)}</td>
                    <td className="name">
                      <Link to={`/ruler/${r.id}`}>
                        <Portrait profile={profileByKey(r.personKey)} name={r.name} compact hideEmpty />{' '}
                        <ReignName reign={r} />
                      </Link>
                    </td>
                    <td className="life">
                      <LifeText life={r.life} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
