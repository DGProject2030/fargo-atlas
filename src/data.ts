// Typed access to the data files. Vite bundles the JSON at build time.
import episodesJson from '../data/episodes.json'
import charactersJson from '../data/characters.json'
import linksJson from '../data/links.json'

export interface Episode {
  id: string
  season: number
  number: number
  title_en: string
  title_he: string
  air_date: string
  story_year: number
  director: string
  writers: string[]
  synopsis_en: string
  synopsis_he: string
  link_ids: string[]
}

export interface Character {
  id: string
  name_en: string
  name_he: string
  seasons: number[]
  faction: 'law' | 'crime' | 'civilian' | 'drifter'
  fate: 'alive' | 'dead' | 'unknown'
  bio_en: string
  bio_he: string
  also_known_as: string[]
}

export interface Link {
  id: string
  from_id: string
  to_id: string
  character_ids: string[]
  kind: 'same-person' | 'object' | 'event' | 'family' | 'echo'
  evidence_en: string
  evidence_he: string
  confirmed: boolean
}

export const episodes = episodesJson as Episode[]
export const characters = charactersJson as Character[]
export const links = linksJson as Link[]
