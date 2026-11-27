import { useQuery } from "@tanstack/react-query";
import { type AnyRootRoute, createRoute, Link as RouterLink } from "@tanstack/react-router";
import { ArrowLeft, RotateCw, Star } from "lucide-react";
import type { ReactNode } from "react";

import { ActivityIndicator, ButtonTextAndSymbol, LinkSymbol, SectionHeader } from "@prime/ui";

import type { MovieDetail, SimilarMovie } from "../domain/movie.ts";
import { formatDuration } from "./duration.ts";
import { riseInOrder } from "./motion.ts";
import { ageRatingLabel, eyebrowOf } from "./movie-labels.ts";
import { MovieThumbLink } from "./movie-thumb-link.tsx";
import type { GetMovie } from "./use-cases.ts";

import styles from "./trailer-route.module.css";

const NOT_FOUND = "Ce film n'existe pas.";

const youtubeEmbedOf = (trailerKey: string) =>
  `https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0`;

const movieIdOf = (param: string): number | undefined =>
  /^\d+$/u.test(param) ? Number(param) : undefined;

const ratingOf = ({ averageRating, reviewCount }: MovieDetail) =>
  averageRating === undefined
    ? "Pas encore d'avis"
    : `${averageRating.toLocaleString("fr-FR")} / 5 · ${reviewCount} avis`;

const Player = ({ movie }: { readonly movie: MovieDetail }) =>
  movie.trailerKey === undefined ? (
    <p className={styles.message}>Ce film n'a pas encore de bande-annonce.</p>
  ) : (
    <div className={styles.stage}>
      <iframe
        className={styles.player}
        src={youtubeEmbedOf(movie.trailerKey)}
        title={`Bande-annonce de ${movie.title}`}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );

const Details = ({ movie }: { readonly movie: MovieDetail }) => (
  <section aria-label="À propos du film" className={styles.details}>
    <ul className={styles.facts}>
      <li className={styles.badge}>{ageRatingLabel(movie.ageRating)}</li>
      <li>{movie.releaseYear}</li>
      <li>{formatDuration(movie.duration)}</li>
      <li className={styles.rating}>
        <Star aria-hidden="true" />
        {ratingOf(movie)}
      </li>
    </ul>
    {movie.synopsis !== undefined && (
      <p data-synopsis className={styles.synopsis}>
        {movie.synopsis}
      </p>
    )}
  </section>
);

const SimilarMovies = ({ movies }: { readonly movies: readonly SimilarMovie[] }) => (
  <section aria-label="Titres similaires" className={styles.similar}>
    <SectionHeader title="Titres similaires" />
    <ul className={styles.thumbs}>
      {movies.map((movie, index) => (
        <li key={movie.id} {...riseInOrder(index)}>
          <MovieThumbLink movie={movie} />
        </li>
      ))}
    </ul>
  </section>
);

const MoviePage = ({ movie }: { readonly movie: MovieDetail }) => (
  <>
    {movie.backdropUrl !== undefined && (
      <div className={styles.ambient}>
        <img className={styles.backdrop} src={movie.backdropUrl} alt="" />
      </div>
    )}
    <div className={styles.screen}>
      <BackLink />
      <header className={styles.header}>
        <p className={styles.eyebrow}>{eyebrowOf(movie)}</p>
        <h1 className={styles.title}>{movie.title}</h1>
      </header>
      <div className={styles.body}>
        <Player movie={movie} />
        <Details movie={movie} />
      </div>
    </div>
    {movie.similarMovies.length > 0 && <SimilarMovies movies={movie.similarMovies} />}
  </>
);

const BackLink = () => (
  <LinkSymbol
    label="Retour"
    symbol={<ArrowLeft />}
    render={(anchor) => <RouterLink {...anchor} to="/" />}
  />
);

const Status = ({ children }: { readonly children: ReactNode }) => (
  <div className={styles.screen}>
    <BackLink />
    {children}
  </div>
);

const Trailer = ({
  movieId,
  getMovie,
}: {
  readonly movieId: number;
  readonly getMovie: GetMovie;
}) => {
  const movie = useQuery({ queryKey: ["movie", movieId], queryFn: () => getMovie(movieId) });
  if (movie.data === undefined) {
    return (
      <Status>
        <ActivityIndicator label="Chargement de la bande-annonce" />
      </Status>
    );
  }
  if (!movie.data.ok) {
    return (
      <Status>
        {movie.data.error === "not_found" ? (
          <p className={styles.message}>{NOT_FOUND}</p>
        ) : (
          <div role="alert" className={styles.failure}>
            <p className={styles.message}>Impossible de charger la bande-annonce.</p>
            <ButtonTextAndSymbol
              label="Réessayer"
              symbol={<RotateCw />}
              onClick={() => void movie.refetch()}
            />
          </div>
        )}
      </Status>
    );
  }
  return <MoviePage movie={movie.data.value} />;
};

export const trailerRoute = ({
  parent,
  getMovie,
}: {
  readonly parent: AnyRootRoute;
  readonly getMovie: GetMovie;
}) => {
  const route = createRoute({
    getParentRoute: () => parent,
    path: "/films/$movieId/bande-annonce",
    component: function TrailerPage() {
      const movieId = movieIdOf(route.useParams().movieId);
      return (
        <div className={styles.page}>
          {movieId === undefined ? (
            <Status>
              <p className={styles.message}>{NOT_FOUND}</p>
            </Status>
          ) : (
            <Trailer key={movieId} movieId={movieId} getMovie={getMovie} />
          )}
        </div>
      );
    },
  });
  return route;
};
