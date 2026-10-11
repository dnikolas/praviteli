export type EraId = 'nov' | 'kiev' | 'vlad' | 'mos' | 'spb' | 'ussr'

export interface Era {
  id: EraId
  station: string
  cap: string
  span: string
}

export interface Reign {
  id: string
  eraId: EraId
  years: string
  name: string
  nick?: string
  origin?: string
  life: string
  dynasty: string
  personKey: string
  violentDeath: boolean
  approx: boolean
  added: boolean
  posterNote?: string
}

export type PortraitKind = 'lifetime' | 'later'

export interface PersonProfile {
  personKey: string
  summary?: string
  facts?: string[]
  title?: string
  burial?: string
  wikidataId?: string
  portrait?: {
    src: string
    alt: string
    credit: string
    kind: PortraitKind
  }
}

export interface TimelineItem {
  kind: 'reign' | 'dynasty'
  eraId: EraId
  title?: string
  sub?: string
  pill?: 'ryur' | 'rom' | 'rf'
  reign?: Reign
}
