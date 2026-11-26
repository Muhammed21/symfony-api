import { expect, test } from 'vitest'
import { formatDuration } from './format'

test.each([
  [142, '2 h 22'],
  [125, '2 h 05'],
  [120, '2 h'],
  [45, '45 min'],
])('affiche une durée de %i minutes comme « %s »', (minutes, expected) => {
  expect(formatDuration(minutes)).toBe(expected)
})
