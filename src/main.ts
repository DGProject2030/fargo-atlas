import './ui/tokens.css'
import { getLang, setLang, t } from './i18n'
import { esc } from './ui/html'
import { renderTimeline } from './views/timeline'

const VIEWS = ['timeline', 'web', 'episodes', 'links'] as const
type View = (typeof VIEWS)[number]

const app = document.querySelector<HTMLDivElement>('#app')!

function currentView(): View {
  const name = location.hash.replace(/^#\//, '')
  return (VIEWS as readonly string[]).includes(name) ? (name as View) : 'timeline'
}

function render(): void {
  const view = currentView()
  const other = getLang() === 'he' ? 'en' : 'he'
  document.title = t('site.title')

  app.innerHTML = `
    <header class="site-header">
      <a class="brand" href="#/timeline">${esc(t('site.title'))}</a>
      <nav class="site-nav" aria-label="${esc(t('nav.label'))}">
        <ul>
          ${VIEWS.map(
            (v) =>
              `<li><a href="#/${v}"${v === view ? ' aria-current="page"' : ''}>${esc(t(`nav.${v}`))}</a></li>`,
          ).join('')}
        </ul>
      </nav>
      <button type="button" class="lang-toggle" lang="${other}">${other === 'he' ? 'עברית' : 'English'}</button>
    </header>
    <main id="view"></main>`

  app.querySelector('.lang-toggle')!.addEventListener('click', () => void setLang(other))

  const main = app.querySelector<HTMLElement>('#view')!
  if (view === 'timeline') renderTimeline(main)
  else main.innerHTML = `<h1>${esc(t(`nav.${view}`))}</h1><p class="soon">${esc(t('view.soon'))}</p>`
}

window.addEventListener('hashchange', render)
window.addEventListener('langchange', render)
void setLang(getLang())
