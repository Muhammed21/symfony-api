import type { Result } from "@prime/result";

import type {
  CatalogueFailure,
  Genre,
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
