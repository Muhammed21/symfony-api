import { useQuery } from "@tanstack/react-query";
import { type AnyRootRoute, createRoute, Link as RouterLink } from "@tanstack/react-router";
import { ArrowLeft, RotateCw } from "lucide-react";

import { ActivityIndicator, ButtonTextAndSymbol, LinkSymbol } from "@prime/ui";

import type { Movie } from "../domain/movie.ts";
import type { GetMovie } from "./use-cases.ts";

import styles from "./trailer-route.module.css";

const NOT_FOUND = "Ce film n'existe pas.";

const youtubeEmbedOf = (trailerKey: string) =>
  `https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0`;

const movieIdOf = (param: string): number | undefined =>
  /^\d+$/u.test(param) ? Number(param) : undefined;

const Player = ({ movie }: { readonly movie: Movie }) =>
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

const Trailer = ({
  movieId,
  getMovie,
}: {
  readonly movieId: number;
  readonly getMovie: GetMovie;
}) => {
  const movie = useQuery({ queryKey: ["movie", movieId], queryFn: () => getMovie(movieId) });
  if (movie.data === undefined) {
    return <ActivityIndicator label="Chargement de la bande-annonce" />;
  }
  if (!movie.data.ok) {
    return movie.data.error === "not_found" ? (
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
    );
  }
  return (
    <>
      <h1 className={styles.title}>{movie.data.value.title}</h1>
      <Player movie={movie.data.value} />
    </>
  );
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
          <LinkSymbol
            label="Retour"
            symbol={<ArrowLeft />}
            render={(anchor) => <RouterLink {...anchor} to="/" />}
          />
          {movieId === undefined ? (
            <p className={styles.message}>{NOT_FOUND}</p>
          ) : (
            <Trailer movieId={movieId} getMovie={getMovie} />
          )}
        </div>
      );
    },
  });
  return route;
};
