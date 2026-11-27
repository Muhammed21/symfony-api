import type { Result } from "@prime/result";

import type {
  CatalogueFailure,
  Genre,
  Movie,
  MovieFilters,
  MoviePage,
  MovieSort,
} from "../domain/movie.ts";

export type ListMovies = (query: {
  readonly page: number;
  readonly filters: MovieFilters;
  readonly sort?: MovieSort;
}) => Promise<Result<MoviePage, CatalogueFailure>>;

export type ListGenres = () => Promise<Result<readonly Genre[], CatalogueFailure>>;

export type GetMovie = (id: number) => Promise<Result<Movie, CatalogueFailure>>;
