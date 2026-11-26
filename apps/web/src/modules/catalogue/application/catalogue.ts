import type { Result } from "@prime/result";

import type { CatalogueFailure, Genre, MovieFilters, MoviePage } from "../domain/movie.ts";
import type { CatalogueGateway } from "./catalogue-gateway.ts";

export const MOVIES_PER_PAGE = 12;

export const catalogueUseCases = ({ gateway }: { readonly gateway: CatalogueGateway }) => ({
  listMovies: ({
    page,
    filters,
  }: {
    readonly page: number;
    readonly filters: MovieFilters;
  }): Promise<Result<MoviePage, CatalogueFailure>> =>
    gateway.listMovies({ page, limit: MOVIES_PER_PAGE, filters }),
  listGenres: (): Promise<Result<readonly Genre[], CatalogueFailure>> => gateway.listGenres(),
});
