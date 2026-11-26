import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import App from './App'

test('la page d’accueil présente le catalogue Prime Video', async () => {
  const screen = await render(<App />)

  await expect.element(screen.getByRole('heading', { level: 1, name: 'Prime Video' })).toBeVisible()
})
