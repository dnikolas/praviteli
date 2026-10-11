import { useEffect, type CSSProperties } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { LifeText } from '../components/ReignName'
import { Portrait } from '../components/Portrait'
import { profileByKey } from '../data/profiles'
import { COPY, ERA_COLOR, REIGNS, eraById, eraLabel, reignById, reignsByPerson } from '../data/rulers'
import { yearsDuration } from '../utils'

export function Ruler() {
  const { id } = useParams()
  const navigate = useNavigate()
  const reign = id ? reignById(id) : undefined
  const idx = reign ? REIGNS.findIndex((r) => r.id === reign.id) : -1
  const prev = idx > 0 ? REIGNS[idx - 1] : undefined
  const next = idx >= 0 && idx < REIGNS.length - 1 ? REIGNS[idx + 1] : undefined

  useEffect(() => {
    if (!reign) return
    document.title = `${reign.name} — Правители`
  }, [reign])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null
      if (t && (t.closest('input, textarea, select, [contenteditable="true"]') || t.isContentEditable)) return
      if (e.key === 'ArrowLeft' && prev) navigate(`/ruler/${prev.id}`)
      if (e.key === 'ArrowRight' && next) navigate(`/ruler/${next.id}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, prev, next])

  if (!reign) return <Navigate to="/catalog" replace />

  const era = eraById(reign.eraId)
  const profile = profileByKey(reign.personKey)
  const related = reignsByPerson(reign.personKey).filter((r) => r.id !== reign.id)
  const dur = yearsDuration(reign.years)
  const title = profile?.title
  const showTitle = Boolean(title && title !== reign.origin)
  const crumbsName = reign.nick ? `«${reign.nick}»` : reign.name
  const meta = [reign.years, dur, eraLabel(era.id, era.station), reign.dynasty].filter(Boolean)

  return (
    <div className="wrap detail">
      <nav className="crumbs" aria-label="Путь">
        <Link to="/">Хронология</Link>
        <span aria-hidden>/</span>
        <Link to={`/#era-${era.id}`}>{eraLabel(era.id, era.station)}</Link>
        <span aria-hidden>/</span>
        <span>{crumbsName}</span>
      </nav>

      <article className="detail-card" style={{ '--era': ERA_COLOR[reign.eraId] } as CSSProperties}>
        <div className="detail-top">
          <Portrait profile={profile} name={reign.name} />
          <div className="detail-copy">
            <h1>
              {reign.name}
              {reign.nick ? <span className="nick"> «{reign.nick}»</span> : null}
              {reign.origin ? <span className="origin"> {reign.origin}</span> : null}
            </h1>
            <p className="detail-meta">{meta.join(' · ')}</p>
            {profile?.summary ? <p className="summary">{profile.summary}</p> : null}
            {profile?.facts?.length ? (
              <div className="facts">
                <h2>Важно знать</h2>
                <ul className="fact-chips">
                  {profile.facts.slice(0, 3).map((f) => (
                    <li key={f} className="chip">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        <dl className="kv">
          {reign.life ? (
            <>
              <dt>Годы жизни</dt>
              <dd className="mono">
                <LifeText life={reign.life} />
              </dd>
            </>
          ) : null}
          {showTitle ? (
            <>
              <dt>Титул</dt>
              <dd>{title}</dd>
            </>
          ) : null}
          {profile?.burial ? (
            <>
              <dt>Погребение</dt>
              <dd>{profile.burial}</dd>
            </>
          ) : null}
          {reign.approx || reign.violentDeath ? (
            <>
              <dt>Пометки</dt>
              <dd className="suggests" style={{ justifyContent: 'flex-start', marginTop: 0 }}>
                {reign.approx ? <span className="chip">приблизительный год</span> : null}
                {reign.violentDeath ? <span className="chip">насильственная смерть</span> : null}
              </dd>
            </>
          ) : null}
        </dl>
        {reign.posterNote ? <div className="note" style={{ marginTop: 16 }}>{reign.posterNote}</div> : null}
        {reign.personKey === 'putin' && reign.years.includes('н. в.') ? (
          <div className="note" style={{ marginTop: 16 }}>{COPY.putinNote}</div>
        ) : null}

        {related.length ? (
          <section className="related">
            <h2>Другие сроки того же правителя</h2>
            <div className="card-grid related-grid">
              {related.map((r) => (
                <Link key={r.id} to={`/ruler/${r.id}`} className="card-tile">
                  <Portrait profile={profileByKey(r.personKey)} name={r.name} tile />
                  <span className="card-tile-body">
                    <span className="years">{r.years}</span>
                    <b>{eraLabel(r.eraId)}</b>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <nav className="neighbors" aria-label="Соседние правления">
          {prev ? (
            <Link to={`/ruler/${prev.id}`} className="neighbor">
              <Portrait profile={profileByKey(prev.personKey)} name={prev.name} compact />
              <span>
                <small>← Предыдущее</small>
                {prev.name}
                <span className="years">{prev.years}</span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link to={`/ruler/${next.id}`} className="neighbor neighbor-next">
              <span>
                <small>Следующее →</small>
                {next.name}
                <span className="years">{next.years}</span>
              </span>
              <Portrait profile={profileByKey(next.personKey)} name={next.name} compact />
            </Link>
          ) : null}
        </nav>
      </article>
    </div>
  )
}
