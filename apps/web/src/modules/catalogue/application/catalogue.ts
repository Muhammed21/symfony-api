import type { Result } from "@prime/result";

import type {
  CatalogueFailure,
  Genre,
  Movie,
  MovieFilters,
  MoviePage,
  MovieSort,
} from "../domain/movie.ts";
import type { CatalogueGateway } from "./catalogue-gateway.ts";

export const MOVIES_PER_PAGE = 12;

export const catalogueUseCases = ({ gateway }: { readonly gateway: CatalogueGateway }) => ({
  listMovies: ({
    page,
    filters,
    sort = "title",
  }: {
    readonly page: number;
    readonly filters: MovieFilters;
    readonly sort?: MovieSort;
  }): Promise<Result<MoviePage, CatalogueFailure>> =>
    gateway.listMovies({ page, limit: MOVIES_PER_PAGE, filters, sort }),
  listGenres: (): Promise<Result<readonly Genre[], CatalogueFailure>> => gateway.listGenres(),
  getMovie: (id: number): Promise<Result<Movie, CatalogueFailure>> => gateway.getMovie(id),
});
