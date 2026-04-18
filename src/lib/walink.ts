export const WA_REDIRECT_BASE_URL =
  'https://qtjwzfbinsrmnvlsgvtw.supabase.co/functions/v1/wa-redirect'

export const buildShortLink = (slug: string) =>
  `${WA_REDIRECT_BASE_URL}/${slug}`

export const buildWaUrl = (phone: string, message: string, type: string) => {
  if (type === 'catalog') return `https://wa.me/c/${phone}`
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${phone}${text}`
}

export const generateSlug = () =>
  Math.random().toString(36).substring(2, 8)
