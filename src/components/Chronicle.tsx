import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { profileByKey } from '../data/profiles'
import { ERA_COLOR, ERAS, REIGNS, TIMELINE, eraLabel } from '../data/rulers'
import type { EraId } from '../types'
import { yearsDuration } from '../utils'
import { CenturyRail } from './CenturyRail'
import { Portrait } from './Portrait'
import { LifeText, ReignName } from './ReignName'
import { TimeAxis } from './TimeAxis'

function scrollToEra(id: EraId) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(`era-${id}`)?.scrollIntoView({
    behavior: reduce ? 'auto' : 'smooth',
    block: 'start',
  })
  history.replaceState(null, '', `#era-${id}`)
}

export function Chronicle() {
  const { hash } = useLocation()
  const [active, setActive] = useState<EraId>(ERAS[0].id)
  const chapters = useMemo(() => ERAS.map((e) => e.id), [])

  useEffect(() => {
    if (!hash) return
    const id = hash.replace(/^#era-/, '') as EraId
    if (chapters.includes(id)) {
      document.getElementById(`era-${id}`)?.scrollIntoView({ block: 'start' })
      setActive(id)
    }
  }, [hash, chapters])

  useEffect(() => {
    const nodes = chapters
      .map((id) => document.getElementById(`era-${id}`))
      .filter((n): n is HTMLElement => Boolean(n))
    if (!nodes.length) return
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        const id = visible?.target.id.replace(/^era-/, '') as EraId | undefined
        if (id && chapters.includes(id)) setActive(id)
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0.1, 0.25, 0.5] },
    )
    for (const n of nodes) io.observe(n)
    return () => io.disconnect()
  }, [chapters])

  return (
    <div className="chronicle" id="chronicle">
      <div className="era-cluster">
        <TimeAxis
          activeId={active}
          onPickEra={(id) => {
            setActive(id)
            scrollToEra(id)
          }}
        />
        <nav className="era-rail" aria-label="Эпохи">
          {ERAS.map((era) => (
            <a
              key={era.id}
              href={`#era-${era.id}`}
              className={`era-rail-item${active === era.id ? ' is-active' : ''}`}
              aria-current={active === era.id ? 'true' : undefined}
              onClick={(e) => {
                e.preventDefault()
                setActive(era.id)
                scrollToEra(era.id)
              }}
            >
              <i className="dot" style={{ '--era': ERA_COLOR[era.id] } as CSSProperties} />
              {eraLabel(era.id)}
            </a>
          ))}
        </nav>
      </div>

      <div className="chronicle-body">
        <div className="chronicle-main">
          <div className="legend">
            <span><b>~</b> приблизительный год</span>
            <span><b>х</b> насильственная смерть</span>
            <span><b>[…]</b> происхождение или титул</span>
            <span><b>«…»</b> прозвище</span>
            <span><b>н. в.</b> правление продолжается</span>
          </div>

          <div className="annals">
            {ERAS.map((era) => {
              const items = TIMELINE.filter((t) => t.eraId === era.id)
              return (
                <section
                  key={era.id}
                  id={`era-${era.id}`}
                  className="era-chapter"
                  style={{ '--era': ERA_COLOR[era.id] } as CSSProperties}
                >
                  <header className="era-chapter-head">
                    <div className="era-chapter-mark" aria-hidden />
                    <p className="cap">{era.cap}</p>
                    <h2>{era.station}</h2>
                    <p className="span">{era.span}</p>
                  </header>
                  <div className="annal-head">
                    <span className="annal-years">Годы правления</span>
                    <span className="annal-dur">Лет у власти</span>
                    <span className="annal-name">Правитель</span>
                    <span className="annal-life">Годы жизни</span>
                  </div>

                  <ol className="annal-list">
                    {items.map((item, i) => {
                      if (item.kind === 'dynasty') {
                        return (
                          <li key={`${item.title}-${i}`} className="annal-dynasty">
                            <span className={`dyn ${item.pill ?? ''}`}>{item.title}</span>
                            {item.sub ? <span className="dyn-sub">{item.sub}</span> : null}
                          </li>
                        )
                      }
                      const r = item.reign!
                      const dur = yearsDuration(r.years)
                      return (
                        <li key={r.id}>
                          <Link to={`/ruler/${r.id}`} className="annal-row">
                            <Portrait profile={profileByKey(r.personKey)} name={r.name} compact />
                            <span className="annal-years">{r.years}</span>
                            <span className="annal-dur">{dur || '—'}</span>
                            <span className="annal-name">
                              <ReignName reign={r} />
                            </span>
                            <span className="annal-life">
                              <LifeText life={r.life} />
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ol>
                </section>
              )
            })}
          </div>
        </div>
        <CenturyRail
          activeId={active}
          onPickEra={(id) => {
            setActive(id)
            scrollToEra(id)
          }}
        />
      </div>
    </div>
  )
}
