import type { Reign } from './types'

export const AXIS_START = 862

export function axisEnd(nowYear = new Date().getFullYear()): number {
  return nowYear
}

export function axisPercent(year: number, nowYear = new Date().getFullYear()): number {
  const end = axisEnd(nowYear)
  const span = Math.max(1, end - AXIS_START)
  const y = Math.min(end, Math.max(AXIS_START, year))
  return ((y - AXIS_START) / span) * 100
}

export function reignYearRange(
  years: string,
  nowYear = new Date().getFullYear(),
): { start: number; end: number } | null {
  const m = years.match(/\d{3,4}/g)
  if (!m?.length) return null
  const start = +m[0]
  if (/н\.\s?в\./.test(years)) return { start, end: nowYear }
  if (m.length < 2) return { start, end: start }
  return { start, end: +m[1] }
}

export function yearsDuration(years: string, nowYear = new Date().getFullYear()): string {
  const m = years.match(/\d{3,4}/g)
  if (!m?.length) return ''
  if (/н\.\s?в\./.test(years)) {
    const o = nowYear - +m[0]
    return `${o} ${pluralYears(o)}`
  }
  if (m.length < 2) return ''
  const d = +m[1] - +m[0]
  if (d === 0) return '< 1 года'
  return `${d} ${pluralYears(d)}`
}

export function durationYears(years: string, nowYear = new Date().getFullYear()): number | null {
  const m = years.match(/\d{3,4}/g)
  if (!m?.length) return null
  if (/н\.\s?в\./.test(years)) return nowYear - +m[0]
  if (m.length < 2) return null
  return +m[1] - +m[0]
}

export function yearsSum(items: Array<{ years: string }>, nowYear = new Date().getFullYear()): number {
  return items.reduce((sum, r) => sum + (durationYears(r.years, nowYear) ?? 0), 0)
}

export function pluralYears(n: number): string {
  return plural(n, 'год', 'года', 'лет')
}

export function pluralReigns(n: number): string {
  return `${n} ${plural(n, 'правление', 'правления', 'правлений')}`
}

function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n)
  if (abs % 10 === 1 && abs % 100 !== 11) return one
  if (abs % 10 >= 2 && abs % 10 <= 4 && (abs % 100 < 10 || abs % 100 >= 20)) return few
  return many
}

export function searchText(r: Reign): string {
  return ` ${r.name} ${r.nick ?? ''} ${r.origin ?? ''} ${r.years} ${r.life} ${r.dynasty} `.toLowerCase()
}

export function scoreReign(r: Reign, q: string): number {
  const s = q.trim().toLowerCase()
  if (!s) return 0
  const name = r.name.toLowerCase()
  const nick = (r.nick ?? '').toLowerCase()
  const origin = (r.origin ?? '').toLowerCase()
  if (nick === s || name === s) return 100
  if (nick.startsWith(s)) return 90
  if (name.startsWith(s)) return 80
  if (nick.includes(s)) return 70
  if (name.includes(s)) return 60
  if (r.years.includes(s) || r.life.includes(s)) return 50
  if (origin.includes(s)) return 35
  if (searchText(r).includes(s)) return 20
  return 0
}

export function searchReigns(reigns: Reign[], q: string, limit = 8): Reign[] {
  const s = q.trim().toLowerCase()
  if (!s) return []
  return reigns
    .map((r) => ({ r, score: scoreReign(r, s) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.r.years.localeCompare(b.r.years))
    .slice(0, limit)
    .map((x) => x.r)
}

export function slugify(name: string, years: string): string {
  const base = `${name}-${years}`
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/н\.\s?в\./g, 'nv')
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
  return base
}

export function downloadCsv(rows: string[]): void {
  const blob = new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'praviteli-gosudarstva.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}

export function csvEscape(v: string): string {
  return `"${String(v).replace(/"/g, '""')}"`
}
