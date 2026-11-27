import type { Result } from "@prime/result";

import type {
  CatalogueFailure,
  Genre,
  MovieDetail,
  MovieFilters,
  MoviePage,
  MovieSort,
} from "../domain/movie.ts";

export type CatalogueGateway = {
  readonly listMovies: (query: {
    readonly page: number;
    readonly limit: number;
    readonly filters: MovieFilters;
    readonly sort: MovieSort;
  }) => Promise<Result<MoviePage, CatalogueFailure>>;
  readonly listGenres: () => Promise<Result<readonly Genre[], CatalogueFailure>>;
  readonly getMovie: (id: number) => Promise<Result<MovieDetail, CatalogueFailure>>;
};
