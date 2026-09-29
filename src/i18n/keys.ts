// Every UI string key with its English default.
// This is the key list the localizer translates into public/locales/{he,en}.json.
// Placeholders use {name}.
export const DEFAULTS = {
  'site.title': 'Fargo fan atlas',
  'nav.label': 'Views',
  'nav.timeline': 'Timeline',
  'nav.web': 'Character web',
  'nav.episodes': 'Episode guide',
  'nav.links': 'Links',
  'view.soon': 'This view is coming soon.',
  'timeline.heading': 'Timeline',
  'timeline.order': 'Order',
  'timeline.order.story': 'Story order',
  'timeline.order.release': 'Release order',
  'timeline.film': 'The film',
  'timeline.season': 'Season {n}',
  'timeline.episodes': '{n} episodes',
  'timeline.chart': 'Timeline of the film and the five seasons',
  'timeline.empty': 'No episodes yet.',
} as const

export type Key = keyof typeof DEFAULTS
