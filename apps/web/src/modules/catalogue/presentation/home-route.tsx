import { useQuery } from "@tanstack/react-query";
import { type AnyRootRoute, createRoute, Link as RouterLink } from "@tanstack/react-router";
import { ChevronRight, Info, Play, Plus, RotateCw } from "lucide-react";
import { useState } from "react";

import {
  ActivityIndicator,
  ButtonSymbol,
  ButtonTextAndSymbol,
  LinkSymbol,
  MovieThumb,
  PageControl,
  SectionHeader,
} from "@prime/ui";

import { type Genre, type Movie, thumbnailOf } from "../domain/movie.ts";
import { riseInOrder } from "./motion.ts";
import { eyebrowOf } from "./movie-labels.ts";
import type { ListGenres, ListMovies } from "./use-cases.ts";

import styles from "./home-route.module.css";

const FEATURED_COUNT = 5;

const FIRST_PAGE = 1;

const FeaturedMovie = ({ movies }: { readonly movies: readonly Movie[] }) => {
  const [current, setCurrent] = useState(FIRST_PAGE);
  const movie = movies[current - 1];
  if (movie === undefined) {
    return null;
  }
  return (
    <section aria-label="À la une" className={styles.featured}>
      {movie.backdropUrl !== undefined && (
        <img
          key={`backdrop-${movie.id}`}
          className={styles.backdrop}
          src={movie.backdropUrl}
          alt=""
        />
      )}
      <div key={`content-${movie.id}`} className={styles.featuredContent}>
        <p className={styles.eyebrow}>{eyebrowOf(movie)}</p>
        <h2 className={styles.featuredTitle}>{movie.title}</h2>
        <div className={styles.actions}>
          {movie.trailerKey === undefined ? (
            <div className={styles.play}>
              <ButtonSymbol
                size="extra-large"
                appearance="prominent"
                label="Lecture"
                symbol={<Play />}
                disabled
              />
              <span aria-hidden="true">Lecture</span>
            </div>
          ) : (
            <div className={styles.play}>
              <LinkSymbol
                size="extra-large"
                appearance="prominent"
                label="Bande-annonce"
                symbol={<Play />}
                render={(anchor) => (
                  <RouterLink
                    {...anchor}
                    to="/films/$movieId/bande-annonce"
                    params={{ movieId: String(movie.id) }}
                  />
                )}
              />
              <span aria-hidden="true">Bande-annonce</span>
            </div>
          )}
          <ButtonSymbol size="large" label="Ajouter à ma liste" symbol={<Plus />} disabled />
          <ButtonSymbol size="large" label="Plus d'infos" symbol={<Info />} disabled />
        </div>
        <p className={styles.soon}>Bientôt disponible</p>
      </div>
      {movies.length > 1 && (
        <div className={styles.dots}>
          <PageControl
            label="Films à la une"
            count={movies.length}
            current={current}
            onSelect={setCurrent}
          />
        </div>
      )}
    </section>
  );
};

const MovieRow = ({
  title,
  movies,
  genre,
}: {
  readonly title: string;
  readonly movies: readonly Movie[];
  readonly genre?: number;
}) => (
  <section aria-label={title} className={styles.row}>
    <div className={styles.rowHeader}>
      <SectionHeader
        title={title}
        accessory={
          <LinkSymbol
            size="mini"
            label={`Tout voir : ${title}`}
            symbol={<ChevronRight />}
            render={(anchor) => (
              <RouterLink
                {...anchor}
                to="/catalogue"
                search={genre === undefined ? { page: FIRST_PAGE } : { page: FIRST_PAGE, genre }}
              />
            )}
          />
        }
      />
    </div>
    <ul className={styles.thumbs}>
      {movies.map((movie, index) => {
        const thumbnail = thumbnailOf(movie);
        return (
          <li key={movie.id} {...riseInOrder(index)}>
            <MovieThumb
              title={movie.title}
              captioned
              {...(thumbnail === undefined ? {} : { image: thumbnail })}
            />
          </li>
        );
      })}
    </ul>
  </section>
);

const GenreRow = ({
  genre,
  listMovies,
}: {
  readonly genre: Genre;
  readonly listMovies: ListMovies;
}) => {
  const { data } = useQuery({
    queryKey: ["movies", FIRST_PAGE, { genre: genre.id }],
    queryFn: () => listMovies({ page: FIRST_PAGE, filters: { genre: genre.id } }),
  });
  if (data?.ok !== true || data.value.movies.length === 0) {
    return null;
  }
  return <MovieRow title={genre.name} movies={data.value.movies} genre={genre.id} />;
};

const Home = ({
  listMovies,
  listGenres,
}: {
  readonly listMovies: ListMovies;
  readonly listGenres: ListGenres;
}) => {
  const recent = useQuery({
    queryKey: ["movies", FIRST_PAGE, {}, "recent"],
    queryFn: () => listMovies({ page: FIRST_PAGE, filters: {}, sort: "recent" }),
  });
  const genres = useQuery({ queryKey: ["genres"], queryFn: listGenres });
  if (recent.data === undefined) {
    return (
      <div className={styles.status}>
        <ActivityIndicator label="Chargement de l'accueil" />
      </div>
    );
  }
  if (!recent.data.ok) {
    return (
      <div role="alert" className={styles.status}>
        <p>Impossible de charger les nouveautés.</p>
        <ButtonTextAndSymbol
          label="Réessayer"
          symbol={<RotateCw />}
          onClick={() => void recent.refetch()}
        />
      </div>
    );
  }
  const { movies } = recent.data.value;
  return (
    <>
      <FeaturedMovie movies={movies.slice(0, FEATURED_COUNT)} />
      <div className={styles.rows}>
        <MovieRow title="Nouveautés" movies={movies} />
        {genres.data?.ok === true &&
          genres.data.value.map((genre) => (
            <GenreRow key={genre.id} genre={genre} listMovies={listMovies} />
          ))}
      </div>
    </>
  );
};

export const homeRoute = ({
  parent,
  listMovies,
  listGenres,
}: {
  readonly parent: AnyRootRoute;
  readonly listMovies: ListMovies;
  readonly listGenres: ListGenres;
}) =>
  createRoute({
    getParentRoute: () => parent,
    path: "/",
    component: function HomePage() {
      return (
        <div className={styles.home}>
          <h1 className={styles.visuallyHidden}>Accueil</h1>
          <Home listMovies={listMovies} listGenres={listGenres} />
        </div>
      );
    },
  });
