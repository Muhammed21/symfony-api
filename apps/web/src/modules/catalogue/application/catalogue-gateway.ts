import type { Result } from "@prime/result";

import type { CatalogueFailure, MoviePage } from "../domain/movie.ts";

export type CatalogueGateway = {
  readonly listMovies: (query: {
    readonly page: number;
    readonly limit: number;
  }) => Promise<Result<MoviePage, CatalogueFailure>>;
};
