import { DEFAULTS, type Key } from './keys'

export type Lang = 'he' | 'en'

const STORAGE_KEY = 'fargo-atlas.lang'

// Storage can be blocked (privacy mode); the site still works without it.
const stored = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

let lang: Lang = stored() === 'en' ? 'en' : 'he'
let strings: Partial<Record<Key, string>> = {}

export const getLang = (): Lang => lang

/** Intl locale for dates and numbers. */
export const locale = (): string => (lang === 'he' ? 'he-IL' : 'en-US')

/** Locale string, else the English default. Fills {name} placeholders. */
export function t(key: Key, vars: Record<string, string | number> = {}): string {
  let text: string = strings[key] ?? DEFAULTS[key]
  for (const [name, value] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, String(value))
  return text
}

/**
 * Switch language: set <html lang dir>, fire `langchange` at once (English defaults),
 * then load the locale file and fire `langchange` again.
 */
export async function setLang(next: Lang): Promise<void> {
  lang = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // ignore: see stored()
  }
  document.documentElement.lang = next
  document.documentElement.dir = next === 'he' ? 'rtl' : 'ltr'
  strings = {}
  window.dispatchEvent(new Event('langchange'))
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}locales/${next}.json`)
    strings = res.ok ? await res.json() : {}
  } catch {
    strings = {}
  }
  window.dispatchEvent(new Event('langchange'))
}
