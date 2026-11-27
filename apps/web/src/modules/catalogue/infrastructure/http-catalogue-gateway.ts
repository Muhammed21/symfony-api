import { z } from "zod";

import { err, ok, type Result } from "@prime/result";

import { failureOf, type Fetch, OK, parseJson, send } from "../../../platform/http.ts";
import type { CatalogueGateway } from "../application/catalogue-gateway.ts";
import {
  AGE_RATINGS,
  type CatalogueFailure,
  type Movie,
  type MovieFilters,
  type MovieSort,
} from "../domain/movie.ts";

const GenreOutput = z.object({ id: z.number().int(), name: z.string() });

const MovieOutput = z.object({
  id: z.number().int(),
  title: z.string(),
  releaseYear: z.number().int(),
  duration: z.number().int(),
  ageRating: z.enum(AGE_RATINGS),
  posterUrl: z.string().nullable(),
  backdropUrl: z.string().nullable(),
  trailerKey: z.string().nullable(),
  genres: z.array(GenreOutput),
});

const pageOutputOf = <Item extends z.ZodType>(item: Item) =>
  z.object({
    total: z.number().int(),
    lastPage: z.number().int(),
    items: z.array(item),
  });

const MoviePageOutput = pageOutputOf(MovieOutput);

const GenrePageOutput = pageOutputOf(GenreOutput);

const ALL_GENRES = 100;

const NOT_FOUND = 404;

const movieOf = ({
  genres,
  posterUrl,
  backdropUrl,
  trailerKey,
  ...movie
}: z.infer<typeof MovieOutput>): Movie => ({
  ...movie,
  posterUrl: posterUrl ?? undefined,
  backdropUrl: backdropUrl ?? undefined,
  trailerKey: trailerKey ?? undefined,
  genres: genres.map((genre) => genre.name),
});

const filterParameters = ({ title, year, genre }: MovieFilters) =>
  Object.entries({ title, year, genre }).flatMap(([name, value]): [string, string][] =>
    value === undefined ? [] : [[name, String(value)]],
  );

const sortParameters = (sort: MovieSort): [string, string][] =>
  sort === "title" ? [] : [["sort", sort]];

export const createHttpCatalogueGateway = ({
  apiUrl,
  fetch,
}: {
  readonly apiUrl: string;
  readonly fetch: Fetch;
}): CatalogueGateway => {
  const getJson = async <T>(
    path: string,
    output: z.ZodType<T>,
  ): Promise<Result<T, CatalogueFailure>> => {
    const sent = await send(fetch, `${apiUrl}${path}`, { method: "GET" });
    if (!sent.ok) {
      return sent;
    }
    const response = sent.value;
    if (response.status === NOT_FOUND) {
      return err("not_found");
    }
    if (response.status !== OK) {
      return err(failureOf(response));
    }
    return parseJson(response, output);
  };

  return {
    listMovies: async ({ page, limit, filters, sort }) => {
      const query = new URLSearchParams([
        ["page", String(page)],
        ["limit", String(limit)],
        ...filterParameters(filters),
        ...sortParameters(sort),
      ]);
      const body = await getJson(`/movies?${query}`, MoviePageOutput);
      if (!body.ok) {
        return body;
      }
      const { total, lastPage, items } = body.value;
      return ok({ total, lastPage, movies: items.map(movieOf) });
    },
    listGenres: async () => {
      const body = await getJson(`/genres?limit=${ALL_GENRES}`, GenrePageOutput);
      return body.ok ? ok(body.value.items) : body;
    },
    getMovie: async (id) => {
      const body = await getJson(`/movies/${id}`, MovieOutput);
      return body.ok ? ok(movieOf(body.value)) : body;
    },
  };
};
