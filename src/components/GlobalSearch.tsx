import { FormEvent, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { profileByKey } from '../data/profiles'
import { REIGNS, SEARCH_HINTS } from '../data/rulers'
import { searchReigns, scoreReign } from '../utils'
import { IconSearch } from './Icons'
import { Portrait } from './Portrait'
import { ReignName } from './ReignName'

export function GlobalSearch() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const catalogQ = location.pathname === '/catalog' ? (params.get('q') ?? '') : ''
  const [q, setQ] = useState(catalogQ)
  const [open, setOpen] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [hi, setHi] = useState(0)

  useEffect(() => {
    if (location.pathname === '/catalog') setQ(params.get('q') ?? '')
  }, [location.pathname, params])

  const hits = useMemo(() => searchReigns(REIGNS, q, 8), [q])
  const totalHits = useMemo(
    () => (q.trim() ? REIGNS.filter((r) => scoreReign(r, q) > 0).length : 0),
    [q],
  )
  const showPanel = open && q.trim().length > 0

  function commitQuery(next: string, close = true) {
    const value = next.trim()
    setQ(next)
    if (location.pathname === '/catalog') {
      const p = new URLSearchParams(params)
      if (value) p.set('q', value)
      else p.delete('q')
      setParams(p, { replace: true })
    }
    if (close) {
      setOpen(false)
      setMobile(false)
    }
  }

  function goHits(list = hits) {
    const value = q.trim()
    if (list.length === 1) {
      navigate(`/ruler/${list[0].id}`)
      setOpen(false)
      setMobile(false)
      return
    }
    navigate(value ? `/catalog?q=${encodeURIComponent(value)}` : '/catalog')
    setOpen(false)
    setMobile(false)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (showPanel && hits[hi]) {
      navigate(`/ruler/${hits[hi].id}`)
      setOpen(false)
      setMobile(false)
      return
    }
    goHits()
  }

  useEffect(() => {
    function onDoc(ev: MouseEvent) {
      if (!rootRef.current?.contains(ev.target as Node)) {
        setOpen(false)
        setMobile(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    if (mobile) inputRef.current?.focus()
  }, [mobile])

  return (
    <div className={`global-search${mobile ? ' is-mobile-open' : ''}`} ref={rootRef}>
      <button
        className="icon-btn search-toggle"
        type="button"
        aria-label={mobile ? 'Закрыть поиск' : 'Открыть поиск'}
        aria-expanded={mobile}
        onClick={() => {
          setMobile((v) => !v)
          setOpen(true)
        }}
      >
        <IconSearch />
      </button>
      <form className="header-search" role="search" onSubmit={onSubmit}>
        <IconSearch />
        <input
          ref={inputRef}
          type="search"
          value={q}
          autoComplete="off"
          placeholder="Невский, 1613…"
          aria-label="Поиск правителя"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={showPanel}
          aria-activedescendant={showPanel && hits[hi] ? `${listId}-opt-${hi}` : undefined}
          role="combobox"
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
            setHi(0)
            if (location.pathname === '/catalog') commitQuery(e.target.value, false)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false)
              setMobile(false)
              inputRef.current?.blur()
            }
            if (e.key === 'Enter') {
              e.preventDefault()
              if (hits[hi]) {
                navigate(`/ruler/${hits[hi].id}`)
                setOpen(false)
                setMobile(false)
                return
              }
              goHits()
              return
            }
            if (!showPanel) return
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setHi((i) => (hits.length ? (i + 1) % hits.length : 0))
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              setHi((i) => (hits.length ? (i - 1 + hits.length) % hits.length : 0))
            }
          }}
        />
      </form>
      {showPanel ? (
        <div className="search-pop" id={listId} role="listbox" aria-label="Совпадения">
          {hits.length ? (
            hits.map((r, i) => (
              <Link
                id={`${listId}-opt-${i}`}
                key={r.id}
                role="option"
                aria-selected={i === hi}
                className={`search-hit${i === hi ? ' is-active' : ''}`}
                to={`/ruler/${r.id}`}
                onMouseEnter={() => setHi(i)}
                onClick={() => {
                  setOpen(false)
                  setMobile(false)
                }}
              >
                <Portrait profile={profileByKey(r.personKey)} name={r.name} compact />
                <span className="search-hit-text">
                  <span className="search-hit-name">
                    <ReignName reign={r} />
                  </span>
                  <span className="search-hit-years">{r.years}</span>
                </span>
              </Link>
            ))
          ) : (
            <div className="search-empty" role="status">
              <p>Ничего не найдено. Попробуйте:</p>
              <div className="suggests">
                {SEARCH_HINTS.map((h) =>
                  h.to ? (
                    <Link key={h.label} className="chip" to={h.to} onClick={() => setOpen(false)}>
                      {h.label}
                    </Link>
                  ) : (
                    <button
                      key={h.label}
                      type="button"
                      className="chip"
                      onClick={() => {
                        commitQuery(h.q ?? h.label, false)
                        setQ(h.q ?? h.label)
                        setOpen(true)
                        if (location.pathname !== '/catalog') {
                          navigate(`/catalog?q=${encodeURIComponent(h.q ?? h.label)}`)
                          setOpen(false)
                          setMobile(false)
                        }
                      }}
                    >
                      {h.label}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}
          {totalHits > 1 ? (
            <button type="button" className="search-more" onClick={() => goHits()}>
              Все {totalHits} в каталоге
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
