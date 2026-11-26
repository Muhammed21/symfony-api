import { delay, http, HttpResponse } from 'msw'
import { expect } from 'vitest'
import { render } from 'vitest-browser-react'
import { respondWith, test } from '../test/api'
import { aMovie, aMoviePage } from '../test/movies'
import MoviesPage from './MoviesPage'

test('affiche les films de la première page avec leurs informations', async ({ api }) => {
  api.use(
    respondWith('/api/movies', () =>
      aMoviePage({
        items: [
          aMovie({ id: 1, title: 'Les Évadés', releaseYear: 1994, duration: 142, ageRating: '13+', genres: [{ id: 6, name: 'Drame' }] }),
          aMovie({ id: 2, title: 'Le Roi Lion', releaseYear: 1994, duration: 88, ageRating: 'ALL', genres: [{ id: 2, name: 'Animation' }, { id: 3, name: 'Aventure' }] }),
        ],
      }),
    ),
  )

  const screen = await render(<MoviesPage />)

  const evades = screen.getByRole('article', { name: 'Les Évadés' })
  await expect.element(evades.getByRole('heading', { name: 'Les Évadés' })).toBeVisible()
  await expect.element(evades).toMatchTextContent('1994')
  await expect.element(evades).toMatchTextContent('2 h 22')
  await expect.element(evades).toMatchTextContent('13+')
  await expect.element(evades).toMatchTextContent('Drame')

  const roiLion = screen.getByRole('article', { name: 'Le Roi Lion' })
  await expect.element(roiLion).toMatchTextContent('1 h 28')
  await expect.element(roiLion).toMatchTextContent('Tous publics')
  await expect.element(roiLion).toMatchTextContent('Animation, Aventure')
})

const catalogueOfThreePages = (url: URL) => {
  const page = Number(url.searchParams.get('page'))
  const limit = Number(url.searchParams.get('limit'))
  return aMoviePage({ items: [aMovie({ id: page, title: `Film de la page ${page} (par ${limit})` })], total: 3 * limit, lastPage: 3 })
}

test('demande 12 films par page et navigue avec Suivant et Précédent', async ({ api }) => {
  api.use(respondWith('/api/movies', catalogueOfThreePages))

  const screen = await render(<MoviesPage />)

  await expect.element(screen.getByRole('heading', { name: 'Film de la page 1 (par 12)' })).toBeVisible()
  await expect.element(screen.getByText('Page 1 sur 3')).toBeVisible()
  await expect.element(screen.getByRole('button', { name: 'Précédent' })).toBeDisabled()

  await screen.getByRole('button', { name: 'Suivant' }).click()

  await expect.element(screen.getByRole('heading', { name: 'Film de la page 2 (par 12)' })).toBeVisible()
  await expect.element(screen.getByText('Page 2 sur 3')).toBeVisible()
  await expect.element(screen.getByRole('button', { name: 'Précédent' })).toBeEnabled()

  await screen.getByRole('button', { name: 'Précédent' }).click()

  await expect.element(screen.getByRole('heading', { name: 'Film de la page 1 (par 12)' })).toBeVisible()
})

test('indique le chargement pendant le passage à une autre page', async ({ api }) => {
  api.use(respondWith('/api/movies', catalogueOfThreePages))

  const screen = await render(<MoviesPage />)
  await expect.element(screen.getByText('Page 1 sur 3')).toBeVisible()

  api.use(http.get('/api/movies', () => delay('infinite')))
  await screen.getByRole('button', { name: 'Suivant' }).click()

  await expect.element(screen.getByText('Chargement des films…')).toBeVisible()
  await expect.element(screen.getByRole('heading', { name: 'Film de la page 1 (par 12)' })).not.toBeInTheDocument()
})

test('désactive Suivant sur la dernière page', async ({ api }) => {
  api.use(respondWith('/api/movies', catalogueOfThreePages))

  const screen = await render(<MoviesPage />)
  await screen.getByRole('button', { name: 'Suivant' }).click()
  await screen.getByRole('button', { name: 'Suivant' }).click()

  await expect.element(screen.getByText('Page 3 sur 3')).toBeVisible()
  await expect.element(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled()
})

test('indique le chargement tant que l’API n’a pas répondu', async ({ api }) => {
  api.use(http.get('/api/movies', () => delay('infinite')))

  const screen = await render(<MoviesPage />)

  await expect.element(screen.getByText('Chargement des films…')).toBeVisible()
})

test('indique un catalogue vide, sans pagination', async ({ api }) => {
  api.use(respondWith('/api/movies', () => aMoviePage({ items: [], total: 0, lastPage: 1 })))

  const screen = await render(<MoviesPage />)

  await expect.element(screen.getByText('Aucun film pour le moment.')).toBeVisible()
  await expect.element(screen.getByRole('button', { name: 'Suivant' })).not.toBeInTheDocument()
})

test('signale une erreur de l’API et permet de réessayer', async ({ api }) => {
  api.use(respondWith('/api/movies', () => aMoviePage({ items: [aMovie({ title: 'Heat' })] })))
  api.use(http.get('/api/movies', () => HttpResponse.json({ title: 'Erreur' }, { status: 500 }), { once: true }))

  const screen = await render(<MoviesPage />)

  await expect.element(screen.getByText('Impossible de charger les films.')).toBeVisible()

  await screen.getByRole('button', { name: 'Réessayer' }).click()

  await expect.element(screen.getByRole('heading', { name: 'Heat' })).toBeVisible()
  await expect.element(screen.getByText('Impossible de charger les films.')).not.toBeInTheDocument()
})

test('signale une réponse au format inattendu', async ({ api }) => {
  api.use(respondWith('/api/movies', () => ({ items: [{ id: 'pas-un-nombre' }] })))

  const screen = await render(<MoviesPage />)

  await expect.element(screen.getByText('Impossible de charger les films.')).toBeVisible()
})
