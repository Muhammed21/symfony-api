import { expect } from 'vitest'
import { render } from 'vitest-browser-react'
import App from './App'
import { respondWith, test } from './test/api'
import { aMovie, aMoviePage } from './test/movies'

test('la page d’accueil présente le catalogue Prime Video', async ({ api }) => {
  api.use(respondWith('/api/movies', () => aMoviePage({ items: [aMovie({ title: 'Heat' })] })))

  const screen = await render(<App />)

  await expect.element(screen.getByRole('heading', { level: 1, name: 'Prime Video' })).toBeVisible()
  await expect.element(screen.getByRole('heading', { level: 2, name: 'Heat' })).toBeVisible()
})
