import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

const root = resolve(import.meta.dirname, '..')
const readJson = (path: string): any => JSON.parse(readFileSync(resolve(root, path), 'utf8'))

const countWords = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length

const ajv = new Ajv2020({ allErrors: true })
addFormats(ajv)
ajv.addKeyword({
  keyword: 'maxWords',
  type: 'string',
  schemaType: 'number',
  validate: (max: number, text: string) => countWords(text) <= max,
  errors: false,
})

const FILES = ['episodes', 'characters', 'links'] as const
const data = Object.fromEntries(FILES.map((f) => [f, readJson(`data/${f}.json`)])) as Record<
  (typeof FILES)[number],
  any[]
>

const duplicates = (ids: string[]): string[] => ids.filter((id, i) => ids.indexOf(id) !== i)

describe('schemas', () => {
  for (const file of FILES) {
    it(`data/${file}.json matches its schema`, () => {
      const validate = ajv.compile(readJson(`data/schemas/${file}.schema.json`))
      const ok = validate(data[file])
      expect(ok ? [] : ajv.errorsText(validate.errors, { separator: '\n' }).split('\n')).toEqual([])
    })

    it(`data/${file}.json has unique ids`, () => {
      expect(duplicates(data[file].map((x) => x.id))).toEqual([])
    })
  }
})

describe('episodes', () => {
  it('id agrees with season and number', () => {
    const bad = data.episodes
      .filter((e) =>
        e.id === 'FILM'
          ? e.season !== 0 || e.number !== 0
          : e.id !== `S${e.season}E${String(e.number).padStart(2, '0')}`,
      )
      .map((e) => e.id)
    expect(bad).toEqual([])
  })
})

describe('references', () => {
  const episodeIds = new Set(data.episodes.map((e) => e.id))
  const characterIds = new Set(data.characters.map((c) => c.id))
  const linkIds = new Set(data.links.map((l) => l.id))

  it('episode link_ids exist in links.json', () => {
    const missing = data.episodes.flatMap((e) =>
      e.link_ids.filter((id: string) => !linkIds.has(id)).map((id: string) => `${e.id} -> ${id}`),
    )
    expect(missing).toEqual([])
  })

  it('link from_id and to_id exist in episodes.json', () => {
    const missing = data.links.flatMap((l) =>
      [l.from_id, l.to_id].filter((id) => !episodeIds.has(id)).map((id) => `${l.id} -> ${id}`),
    )
    expect(missing).toEqual([])
  })

  it('links do not point to their own episode', () => {
    expect(data.links.filter((l) => l.from_id === l.to_id).map((l) => l.id)).toEqual([])
  })

  it('link character_ids exist in characters.json', () => {
    const missing = data.links.flatMap((l) =>
      l.character_ids.filter((id: string) => !characterIds.has(id)).map((id: string) => `${l.id} -> ${id}`),
    )
    expect(missing).toEqual([])
  })
})

describe('locales', () => {
  it('he.json and en.json have the same keys', () => {
    const he = Object.keys(readJson('public/locales/he.json')).sort()
    const en = Object.keys(readJson('public/locales/en.json')).sort()
    expect(he).toEqual(en)
  })
})
