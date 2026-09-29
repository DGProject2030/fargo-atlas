// Timeline: one row per installment (film + five seasons), in story or release order.
import { axisBottom, format, scaleLinear, scaleUtc, select, transition, utcFormat } from 'd3'
import { episodes, type Episode } from '../data'
import { getLang, locale, t } from '../i18n'
import { esc } from '../ui/html'

type Mode = 'story' | 'release'
let mode: Mode = 'story'

interface Installment {
  season: number
  episodes: Episode[]
  story: [number, number]
  aired: [Date, Date]
}

// SVG layout, in viewBox units.
const W = 960
const LABEL_W = 170
const PAD = 90
const ROW_H = 52
const TOP = 8
const AXIS_H = 36
const BAR_H = 14

const parseDate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function installments(): Installment[] {
  const bySeason = new Map<number, Episode[]>()
  for (const e of episodes) bySeason.set(e.season, [...(bySeason.get(e.season) ?? []), e])
  const list = [...bySeason].map(([season, eps]): Installment => {
    eps.sort((a, b) => a.number - b.number)
    const years = eps.map((e) => e.story_year)
    const dates = eps.map((e) => parseDate(e.air_date).getTime())
    return {
      season,
      episodes: eps,
      story: [Math.min(...years), Math.max(...years)],
      aired: [new Date(Math.min(...dates)), new Date(Math.max(...dates))],
    }
  })
  const key = (i: Installment) => (mode === 'story' ? i.story[0] : i.aired[0].getTime())
  return list.sort((a, b) => key(a) - key(b) || a.season - b.season)
}

const rowLabel = (season: number): string =>
  season === 0 ? t('timeline.film') : t('timeline.season', { n: season })

const range = (a: number, b: number): string => (a === b ? String(a) : `${a}–${b}`)

const span = (i: Installment): string =>
  mode === 'story' ? range(...i.story) : range(i.aired[0].getUTCFullYear(), i.aired[1].getUTCFullYear())

const countLabel = (i: Installment): string =>
  i.season === 0 ? '' : t('timeline.episodes', { n: i.episodes.length })

const title = (e: Episode): string => (getLang() === 'he' ? e.title_he : e.title_en)

const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    parseDate(iso),
  )

export function renderTimeline(root: HTMLElement): void {
  root.innerHTML = `
    <h1>${esc(t('timeline.heading'))}</h1>
    <fieldset class="segmented">
      <legend>${esc(t('timeline.order'))}</legend>
      ${(['story', 'release'] as const)
        .map(
          (m) =>
            `<label><input type="radio" name="order" value="${m}"${m === mode ? ' checked' : ''}>${esc(t(`timeline.order.${m}`))}</label>`,
        )
        .join('')}
    </fieldset>
    <svg class="timeline-chart" role="img" aria-label="${esc(t('timeline.chart'))}"></svg>
    <ol class="timeline-list"></ol>`

  if (episodes.length === 0) {
    root.querySelector('fieldset')!.remove()
    root.querySelector('svg')!.remove()
    root.querySelector('ol')!.outerHTML = `<p class="soon">${esc(t('timeline.empty'))}</p>`
    return
  }

  root.querySelectorAll<HTMLInputElement>('input[name="order"]').forEach((input) =>
    input.addEventListener('change', () => {
      mode = input.value as Mode
      draw(root, true)
    }),
  )
  draw(root, false)
}

function draw(root: HTMLElement, animate: boolean): void {
  const rows = installments()
  const rtl = getLang() === 'he'
  const height = TOP + rows.length * ROW_H + AXIS_H
  // Time runs in reading direction: right to left in Hebrew.
  const plot: [number, number] = rtl ? [W - LABEL_W, PAD] : [LABEL_W, W - PAD]
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const duration = animate && !reduced ? 600 : 0

  let px: (i: Installment) => [number, number]
  let axis
  if (mode === 'story') {
    const lo = Math.min(...rows.map((r) => r.story[0]))
    const hi = Math.max(...rows.map((r) => r.story[1]))
    const x = scaleLinear().domain([lo - 3, hi + 3]).range(plot).nice()
    px = (i) => [x(i.story[0]), x(i.story[1])]
    axis = axisBottom(x).ticks(8).tickFormat(format('d'))
  } else {
    const lo = Math.min(...rows.map((r) => r.aired[0].getTime()))
    const hi = Math.max(...rows.map((r) => r.aired[1].getTime()))
    const x = scaleUtc().domain([new Date(lo), new Date(hi)]).range(plot).nice()
    px = (i) => [x(i.aired[0]), x(i.aired[1])]
    axis = axisBottom(x).ticks(8).tickFormat((d) => utcFormat('%Y')(d as Date))
  }
  const barX = (i: Installment) => Math.min(...px(i))
  const barW = (i: Installment) => Math.max(Math.abs(px(i)[1] - px(i)[0]), 8)

  const svg = select(root)
    .select<SVGSVGElement>('svg.timeline-chart')
    .attr('viewBox', `0 0 ${W} ${height}`)
    .style('direction', 'ltr')

  const row = svg
    .selectAll<SVGGElement, Installment>('g.row')
    .data(rows, (d) => String(d.season))
    .join((enter) => {
      const g = enter
        .append('g')
        .attr('class', (d) => (d.season === 0 ? 'row row-film' : 'row'))
        .attr('transform', (_, i) => `translate(0, ${TOP + i * ROW_H})`)
      g.append('line').attr('class', 'row-guide')
      g.append('text').attr('class', 'row-label')
      g.append('text').attr('class', 'row-sub span')
      g.append('rect').attr('class', 'bar').attr('rx', BAR_H / 2).attr('height', BAR_H)
      g.append('text').attr('class', 'row-sub count')
      return g
    })

  const labelX = rtl ? W - 8 : 8
  const labelAnchor = rtl ? 'end' : 'start'
  row
    .select('.row-label')
    .attr('x', labelX)
    .attr('y', ROW_H / 2 - 2)
    .attr('text-anchor', labelAnchor)
    .text((d) => rowLabel(d.season))
  row
    .select('.span')
    .attr('x', labelX)
    .attr('y', ROW_H / 2 + 15)
    .attr('text-anchor', labelAnchor)
    .text((d) => span(d))
  row
    .select('.row-guide')
    .attr('x1', plot[0])
    .attr('x2', plot[1])
    .attr('y1', ROW_H / 2)
    .attr('y2', ROW_H / 2)

  const t0 = transition().duration(duration)
  row.transition(t0).attr('transform', (_, i) => `translate(0, ${TOP + i * ROW_H})`)
  row
    .select('.bar')
    .attr('y', ROW_H / 2 - BAR_H / 2)
    .transition(t0)
    .attr('x', barX)
    .attr('width', barW)
  row
    .select('.count')
    .text((d) => countLabel(d))
    .attr('y', ROW_H / 2 + 4)
    .attr('text-anchor', rtl ? 'end' : 'start')
    .transition(t0)
    .attr('x', (d) => (rtl ? barX(d) - 8 : barX(d) + barW(d) + 8))

  svg
    .selectAll<SVGGElement, null>('g.axis')
    .data([null])
    .join('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0, ${TOP + rows.length * ROW_H + 4})`)
    .transition(t0)
    .call(axis as never)

  drawList(root, rows)
}

function drawList(root: HTMLElement, rows: Installment[]): void {
  const list = root.querySelector<HTMLOListElement>('.timeline-list')!
  const open = new Set([...list.querySelectorAll<HTMLDetailsElement>('details[open]')].map((d) => d.dataset.season))
  list.innerHTML = rows
    .map(
      (i) => `
      <li>
        <details data-season="${i.season}"${open.has(String(i.season)) ? ' open' : ''}>
          <summary>
            <strong>${esc(rowLabel(i.season))}</strong>
            <span class="meta"><span dir="ltr">${esc(span(i))}</span>${i.season === 0 ? '' : ` · ${esc(countLabel(i))}`}</span>
          </summary>
          <ol>
            ${i.episodes
              .map(
                (e) => `
              <li>
                ${e.id === 'FILM' ? '' : `<span class="ep-code" dir="ltr">${esc(e.id)}</span>`}
                ${esc(title(e))}
                <span class="meta">· ${e.story_year} · ${esc(formatDate(e.air_date))}</span>
              </li>`,
              )
              .join('')}
          </ol>
        </details>
      </li>`,
    )
    .join('')
}
