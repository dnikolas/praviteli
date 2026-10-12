import { useLayoutEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { COPY } from '../data/rulers'
import { useTheme } from '../theme'
import { GlobalSearch } from './GlobalSearch'
import { IconMenu, IconMoon, IconSun } from './Icons'

const NAV = [
  { to: '/', label: 'Хронология', end: true },
  { to: '/timeline', label: 'Череда' },
  { to: '/catalog', label: 'Каталог' },
  { to: '/stats', label: 'Сводка' },
]

export function Layout() {
  const { theme, toggle } = useTheme()
  const { pathname, hash } = useLocation()
  const [open, setOpen] = useState(false)

  useLayoutEffect(() => {
    window.history.scrollRestoration = 'manual'
  }, [])

  useLayoutEffect(() => {
    if (hash) return
    const reset = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
    reset()
    const timers = [0, 16, 50, 120, 250].map((ms) => window.setTimeout(reset, ms))
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [pathname, hash])

  return (
    <>
      <a className="skip-link" href="#main">
        К содержанию
      </a>
      <header className="app-header">
        <div className="wrap inner">
          <Link className="brand" to="/" onClick={() => setOpen(false)}>
            {COPY.title}
            <span>{COPY.titleRest}</span>
          </Link>
          <nav id="site-nav" className={`nav ${open ? 'open' : ''}`} aria-label="Разделы">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-tools">
            <GlobalSearch />
            <button
              className="icon-btn"
              type="button"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
              aria-pressed={theme === 'dark'}
            >
              {theme === 'dark' ? <IconSun /> : <IconMoon />}
            </button>
            <button
              className="icon-btn menu-btn"
              type="button"
              aria-label="Меню"
              aria-expanded={open}
              aria-controls="site-nav"
              onClick={() => setOpen((v) => !v)}
            >
              <IconMenu />
            </button>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="app-footer">
        <div className="wrap">{COPY.footer}</div>
      </footer>
    </>
  )
}
