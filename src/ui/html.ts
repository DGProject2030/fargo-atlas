const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

/** Escape text for use inside HTML markup and attribute values. */
export const esc = (text: string): string => text.replace(/[&<>"']/g, (c) => ENTITIES[c])
