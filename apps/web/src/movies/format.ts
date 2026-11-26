import type { Movie } from './api'

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  if (rest === 0) return `${hours} h`
  return `${hours} h ${String(rest).padStart(2, '0')}`
}

export const formatAgeRating = (ageRating: Movie['ageRating']): string => (ageRating === 'ALL' ? 'Tous publics' : ageRating)
