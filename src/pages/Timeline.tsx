import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { IconChevronLeft, IconChevronRight, IconPause, IconPlay } from '../components/Icons'
import { Portrait } from '../components/Portrait'
import { LifeText } from '../components/ReignName'
import { profileByKey } from '../data/profiles'
import {
  COPY,
  ERA_COLOR,
  REIGNS,
  eraById,
  eraLabel,
  reignById,
  reignsByPerson,
} from '../data/rulers'
import type { EraId, Reign } from '../types'
import { usePageTitle } from '../usePageTitle'
import { durationYears, pluralReigns, reignYearRange, yearsDuration } from '../utils'

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII']
const WALK_MS = 5600

type Entry =
  | { kind: 'era'; key: string; id: EraId; label: string }
  | { kind: 'dynasty'; key: string; label: string }
  | { kind: 'reign'; reign: Reign; century: string | null }

function centuryOf(year: number): number {
  return Math.floor((year - 1) / 100) + 1
}

function eraMark(id: EraId): string {
  if (id === 'spb') return 'Петербург'
  if (id === 'mos') return 'Москва'
  if (id === 'ussr') return 'с 1918'
  return eraById(id).station
}

function dynastyTone(name: string): string {
  if (name === 'Рюриковичи') return 'ryur'
  if (name === 'Романовы') return 'rom'
  if (name === 'Российская Федерация') return 'rf'
  return ''
}

function stemHeight(years: string): number {
  const d = durationYears(years)
  if (d == null) return 10
  return Math.round(6 + Math.min(14, Math.sqrt(Math.max(d, 0)) * 2.4))
}

function reignLabel(reign: Reign): string {
  const profile = profileByKey(reign.personKey)
  const nick = reign.nick ? `, ${reign.nick}` : ''
  const origin = reign.origin ? `, ${reign.origin}` : ''
  const parts = [
    `${reign.name}${nick}${origin}`,
    reign.years,
    yearsDuration(reign.years),
    eraLabel(reign.eraId),
    reign.dynasty,
    reign.violentDeath ? 'насильственная смерть' : '',
    profile?.portrait?.kind === 'later' ? 'позднее изображение' : '',
  ]
  return parts.filter(Boolean).join(', ')
}

function ribbonEntries(reigns: Reign[]): Entry[] {
  const out: Entry[] = []
  let era: EraId | null = null
  let dynasty = ''
  let century = 0
  let mark = 0
  for (const reign of reigns) {
    if (reign.eraId !== era) {
      era = reign.eraId
      out.push({ kind: 'era', key: `era-${mark++}`, id: era, label: eraMark(era) })
    }
    if (reign.dynasty && reign.dynasty !== dynasty) {
      dynasty = reign.dynasty
      out.push({ kind: 'dynasty', key: `dyn-${mark++}`, label: dynasty })
    }
    const range = reignYearRange(reign.years)
    let cent: string | null = null
    if (range) {
      const c = centuryOf(range.start)
      if (c !== century) {
        century = c
        cent = `${ROMAN[c] ?? c} в.`
      }
    }
    out.push({ kind: 'reign', reign, century: cent })
  }
  return out
}

export function Timeline() {
  usePageTitle('Чреда правлений — Правители')
  const [params, setParams] = useSearchParams()
  const selected = reignById(params.get('id') ?? '') ?? REIGNS[0]
  const [playing, setPlaying] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [live, setLive] = useState('')
  const scrollerRef = useRef<HTMLDivElement>(null)
  const pendingFocus = useRef<string | null>(null)
  const playingRef = useRef(false)
  const visibleRef = useRef<Reign[]>([])
  const selectedRef = useRef<string>('')

  const visible = REIGNS

  const entries = useMemo(() => ribbonEntries(visible), [visible])

  visibleRef.current = visible
  selectedRef.current = selected?.id ?? ''
  playingRef.current = playing

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => {
      setReduced(mq.matches)
      if (mq.matches) setPlaying(false)
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    function onHide() {
      if (document.hidden) setPlaying(false)
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [])

  useEffect(() => {
    if (!playing || reduced) return
    const timer = window.setInterval(() => {
      if (document.hidden) return
      const list = visibleRef.current
      if (!list.length) {
        setPlaying(false)
        return
      }
      const index = list.findIndex((reign) => reign.id === selectedRef.current)
      if (index < 0) {
        choose(list[0].id, true)
        return
      }
      if (index >= list.length - 1) {
        setPlaying(false)
        return
      }
      choose(list[index + 1].id, true)
    }, WALK_MS)
    return () => window.clearInterval(timer)
  }, [playing, reduced])

  useEffect(() => {
    if (!selected) return
    setLive(`${selected.name}. ${selected.years}. ${eraLabel(selected.eraId)}`)
    const scroller = scrollerRef.current
    const node = scroller?.querySelector<HTMLElement>(`[data-reign="${CSS.escape(selected.id)}"]`)
    if (scroller && node) {
      const left = node.offsetLeft - (scroller.clientWidth - node.offsetWidth) / 2
      scroller.scrollTo({ left: Math.max(0, left), behavior: reduced ? 'auto' : 'smooth' })
    }
    const focusId = pendingFocus.current
    pendingFocus.current = null
    if (focusId === selected.id) node?.focus({ preventScroll: true })
  }, [selected, reduced])

  function choose(id: string, keepPlaying = false) {
    if (!keepPlaying) setPlaying(false)
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('id', id)
        return next
      },
      { replace: true },
    )
  }

  function goTo(index: number, focusRail = false) {
    if (!visible.length) return
    const clamped = Math.min(visible.length - 1, Math.max(0, index))
    const reign = visible[clamped]
    if (focusRail) pendingFocus.current = reign.id
    choose(reign.id)
  }

  function currentIndex(): number {
    return visible.findIndex((reign) => reign.id === selected?.id)
  }

  function onRailKey(e: KeyboardEvent<HTMLDivElement>) {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End', 'PageDown', 'PageUp']
    if (!keys.includes(e.key) || !visible.length) return
    e.preventDefault()
    const index = currentIndex()
    const base = index < 0 ? 0 : index
    if (e.key === 'ArrowRight') goTo(index < 0 ? 0 : index + 1, true)
    if (e.key === 'ArrowLeft') goTo(index < 0 ? 0 : index - 1, true)
    if (e.key === 'Home') goTo(0, true)
    if (e.key === 'End') goTo(visible.length - 1, true)
    if (e.key === 'PageDown') goTo(base + 8, true)
    if (e.key === 'PageUp') goTo(base - 8, true)
  }

  function togglePlay() {
    if (reduced || !visible.length) return
    if (playingRef.current) {
      setPlaying(false)
      return
    }
    const index = visible.findIndex((reign) => reign.id === selectedRef.current)
    if (index < 0 || index >= visible.length - 1) choose(visible[0].id, true)
    setPlaying(true)
    setLive('Просмотр по порядку. Кнопка «Пауза» останавливает.')
  }

  const selectedIndex = currentIndex()
  const tabStop = selected && selectedIndex >= 0 ? selected.id : visible[0]?.id

  return (
    <div className="ribbon-page">
      <section className="page-head">
        <div className="wrap ribbon-wrap">
          <div className="ribbon-title-row">
            <div className="ribbon-title">
              <p className="eyebrow">IX век — наши дни</p>
              <h1>Чреда правлений</h1>
            </div>
            <div className="ribbon-tools">
              <div className="ribbon-step">
                <button type="button" className="btn ribbon-step-btn" onClick={() => goTo(selectedIndex - 1)} disabled={!visible.length || selectedIndex <= 0}>
                  <IconChevronLeft />
                  Раньше
                </button>
                <button type="button" className="btn ribbon-step-btn" onClick={() => goTo(selectedIndex < 0 ? 0 : selectedIndex + 1)} disabled={!visible.length || selectedIndex === visible.length - 1}>
                  Дальше
                  <IconChevronRight />
                </button>
              </div>
              {reduced ? null : (
                <button type="button" className="btn ribbon-play" onClick={togglePlay} aria-pressed={playing} disabled={!visible.length}>
                  {playing ? <IconPause /> : <IconPlay />}
                  {playing ? 'Пауза' : 'Вести по шкале'}
                </button>
              )}
              <p className="ribbon-count">
                <b>{pluralReigns(visible.length)}</b>
                {selectedIndex >= 0 ? <span> · {selectedIndex + 1} из {visible.length}</span> : null}
              </p>
            </div>
          </div>
          <p>
            Власть переходила из рук в руки: от новгородского предания к Киеву, Владимиру, Москве, Петербургу и снова к
            Москве. Рядом стоят и год на столе, и целые десятилетия — по этой разнице видно, где преемственность
            держалась, а где обрывалась.
          </p>
        </div>
      </section>

      <div className="ribbon-page-body">

        <p className="visually-hidden" aria-live="polite">
          {live}
        </p>

        <div
            className="ribbon-scroller"
            ref={scrollerRef}
            onKeyDown={onRailKey}
            onFocus={(e) => {
              const target = e.target
              if (target instanceof HTMLElement && target.dataset.reign) setPlaying(false)
            }}
          >
            <div className="ribbon-track" role="listbox" aria-label="Портреты правителей" aria-orientation="horizontal">
              {entries.map((entry) => {
                if (entry.kind === 'era') {
                  return (
                    <div key={entry.key} className="ribbon-flag" style={{ '--era': ERA_COLOR[entry.id] } as CSSProperties} aria-hidden>
                      <span>{entry.label}</span>
                    </div>
                  )
                }
                if (entry.kind === 'dynasty') {
                  return (
                    <div key={entry.key} className={`ribbon-flag ribbon-flag-dyn dyn ${dynastyTone(entry.label)}`} aria-hidden>
                      <span>{entry.label}</span>
                    </div>
                  )
                }
                const reign = entry.reign
                const on = reign.id === selected?.id
                const kin = Boolean(selected && !on && reign.personKey === selected.personKey)
                const profile = profileByKey(reign.personKey)
                return (
                  <button
                    key={reign.id}
                    type="button"
                    role="option"
                    data-reign={reign.id}
                    className={`ribbon-node ${on ? 'is-on' : ''} ${kin ? 'is-kin' : ''}`}
                    style={{ '--era': ERA_COLOR[reign.eraId] } as CSSProperties}
                    aria-selected={on}
                    aria-controls="ribbon-dossier"
                    tabIndex={reign.id === tabStop ? 0 : -1}
                    aria-label={reignLabel(reign)}
                    onClick={() => choose(reign.id)}
                  >
                    <span className={`ribbon-century ${reign.years.includes('н. в.') ? 'is-now' : ''}`}>
                      {reign.years.includes('н. в.') ? 'сейчас' : (entry.century ?? '')}
                    </span>
                    <span className="ribbon-year">{reignYearRange(reign.years)?.start ?? '—'}</span>
                    <Portrait profile={profile} name={reign.name} rail />
                    <span className="ribbon-stem" style={{ height: stemHeight(reign.years) }} />
                    <span className="ribbon-name">{reign.nick ? `${reign.name.split(' ')[0]} ${reign.nick}` : reign.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

        <div className="wrap ribbon-wrap" id="ribbon-dossier">
          {selected ? (
            <Dossier
              reign={selected}
              index={REIGNS.findIndex((reign) => reign.id === selected.id)}
              onPick={choose}
            />
          ) : (
            <div className="ribbon-empty">
              <p>Выберите портрет на шкале. Здесь откроется справка, с которой удобно запоминать правителя.</p>
              <button type="button" className="btn" onClick={() => visible[0] && choose(visible[0].id)}>
                Начать с {visible[0]?.name ?? 'начала'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Dossier({ reign, index, onPick }: { reign: Reign; index: number; onPick: (id: string) => void }) {
  const era = eraById(reign.eraId)
  const profile = profileByKey(reign.personKey)
  const prev = index > 0 ? REIGNS[index - 1] : undefined
  const next = index >= 0 && index < REIGNS.length - 1 ? REIGNS[index + 1] : undefined
  const kin = reignsByPerson(reign.personKey).filter((item) => item.id !== reign.id)
  const dur = yearsDuration(reign.years)
  const title = profile?.title
  const showTitle = Boolean(title && title !== reign.origin)
  const meta = [reign.years, dur, eraLabel(era.id, era.station), reign.dynasty].filter(Boolean)

  return (
    <article className="detail-card ribbon-panel" style={{ '--era': ERA_COLOR[reign.eraId] } as CSSProperties}>
      <div className="detail-top">
        <Portrait profile={profile} name={reign.name} />
        <div className="detail-copy">
          <h2>
            {reign.name}
            {reign.nick ? <span className="nick"> «{reign.nick}»</span> : null}
            {reign.origin ? <span className="origin"> {reign.origin}</span> : null}
          </h2>
          <p className="detail-meta">{meta.join(' · ')}</p>
          {profile?.summary ? <p className="summary">{profile.summary}</p> : (
            <p className="summary">
              {era.cap}. {reign.dynasty ? `Династия или период: ${reign.dynasty}.` : 'Отдельной биографической справки пока нет.'}
            </p>
          )}
          {profile?.facts?.length ? (
            <div className="facts">
              <h3>Запомнить</h3>
              <ul className="fact-chips">
                {profile.facts.map((fact) => (
                  <li key={fact} className="chip">
                    {fact}
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

      {reign.posterNote ? <div className="note">{reign.posterNote}</div> : null}
      {reign.personKey === 'putin' && reign.years.includes('н. в.') ? <div className="note">{COPY.putinNote}</div> : null}

      {kin.length ? (
        <div className="ribbon-kin">
          <h3>Другие сроки того же правителя</h3>
          <div className="suggests" style={{ justifyContent: 'flex-start' }}>
            {kin.map((item) => (
              <button key={item.id} type="button" className="chip ribbon-era-btn" onClick={() => onPick(item.id)}>
                {item.years}
                <span className="visually-hidden">, {eraLabel(item.eraId)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="ribbon-actions">
        <Link className="btn" to={`/ruler/${reign.id}`}>
          Полная карточка
        </Link>
        <div className="ribbon-step">
          <button type="button" className="btn ribbon-step-btn" onClick={() => prev && onPick(prev.id)} disabled={!prev}>
            <IconChevronLeft />
            {prev ? prev.nick ?? prev.name.split(' ')[0] : 'Начало'}
          </button>
          <button type="button" className="btn ribbon-step-btn" onClick={() => next && onPick(next.id)} disabled={!next}>
            {next ? next.nick ?? next.name.split(' ')[0] : 'Конец'}
            <IconChevronRight />
          </button>
        </div>
      </div>
    </article>
  )
}
