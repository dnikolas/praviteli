import type { Reign } from '../types'

export function ReignName({ reign }: { reign: Reign }) {
  return (
    <>
      <b>{reign.name}</b>
      {reign.nick ? <span className="nick"> «{reign.nick}»</span> : null}
      {reign.origin ? <span className="origin"> {reign.origin}</span> : null}
    </>
  )
}

export function LifeText({ life }: { life: string }) {
  if (!life) return <>—</>
  if (life.endsWith('х')) {
    return (
      <>
        {life.slice(0, -1)}
        <span className="mark-x" title="насильственная смерть">
          х<span className="visually-hidden"> (насильственная смерть)</span>
        </span>
      </>
    )
  }
  return <>{life}</>
}
