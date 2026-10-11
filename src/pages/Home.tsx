import { Chronicle } from '../components/Chronicle'
import { COPY } from '../data/rulers'
import { usePageTitle } from '../usePageTitle'

export function Home() {
  usePageTitle('Правители Руси, СССР и России')
  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-intro">
            <h1>
              {COPY.title}
              <span>{COPY.titleRest}</span>
            </h1>
            <p className="lede">{COPY.lede}</p>
          </div>
          <blockquote className="epigraph">
            <p>{COPY.epigraph}</p>
            <footer>
              <cite>{COPY.epigraphAuthor}</cite>
            </footer>
          </blockquote>
        </div>
      </section>
      <div className="wrap chronicle-wrap">
        <Chronicle />
      </div>
    </>
  )
}
