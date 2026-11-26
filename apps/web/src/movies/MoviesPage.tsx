import { useEffect, useState } from 'react'
import { fetchMoviePage, type Movie, type MoviePage } from './api'
import { formatAgeRating, formatDuration } from './format'

type Request = { page: number }

type Result =
  | { status: 'loading'; request: Request }
  | { status: 'failed'; request: Request }
  | { status: 'loaded'; request: Request; moviePage: MoviePage }

export default function MoviesPage() {
  const [request, setRequest] = useState<Request>({ page: 1 })
  const [result, setResult] = useState<Result>({ status: 'loading', request })

  useEffect(() => {
    let current = true
    fetchMoviePage({ page: request.page })
      .then((moviePage) => current && setResult({ status: 'loaded', request, moviePage }))
      .catch(() => current && setResult({ status: 'failed', request }))
    return () => {
      current = false
    }
  }, [request])

  const goTo = (page: number) => setRequest({ page })
  const retry = () => setRequest({ page: request.page })

  if (result.request !== request || result.status === 'loading') {
    return <p>Chargement des films…</p>
  }

  if (result.status === 'failed') {
    return (
      <div role="alert">
        <p>Impossible de charger les films.</p>
        <button type="button" onClick={retry}>
          Réessayer
        </button>
      </div>
    )
  }

  const { items, lastPage } = result.moviePage

  if (items.length === 0) {
    return <p>Aucun film pour le moment.</p>
  }

  return (
    <>
      <ul>
        {items.map((movie) => (
          <li key={movie.id}>
            <MovieCard movie={movie} />
          </li>
        ))}
      </ul>
      <nav aria-label="Pagination">
        <button type="button" onClick={() => goTo(request.page - 1)} disabled={request.page <= 1}>
          Précédent
        </button>
        <p>
          Page {request.page} sur {lastPage}
        </p>
        <button type="button" onClick={() => goTo(request.page + 1)} disabled={request.page >= lastPage}>
          Suivant
        </button>
      </nav>
    </>
  )
}

function MovieCard({ movie }: { movie: Movie }) {
  const titleId = `movie-${movie.id}`
  return (
    <article aria-labelledby={titleId}>
      <h2 id={titleId}>{movie.title}</h2>
      <p>
        {movie.releaseYear} · {formatDuration(movie.duration)} · {formatAgeRating(movie.ageRating)}
      </p>
      <p>{movie.genres.map((genre) => genre.name).join(', ')}</p>
    </article>
  )
}
