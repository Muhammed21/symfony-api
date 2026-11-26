import type { Result } from "@prime/result";

import type { CatalogueFailure, Genre, MovieFilters, MoviePage } from "../domain/movie.ts";

export type CatalogueGateway = {
  readonly listMovies: (query: {
    readonly page: number;
    readonly limit: number;
    readonly filters: MovieFilters;
  }) => Promise<Result<MoviePage, CatalogueFailure>>;
  readonly listGenres: () => Promise<Result<readonly Genre[], CatalogueFailure>>;
};
