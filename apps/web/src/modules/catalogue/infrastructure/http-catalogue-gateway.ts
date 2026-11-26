import { z } from "zod";

import { err, ok } from "@prime/result";

import { failureOf, type Fetch, OK, parseJson, send } from "../../../platform/http.ts";
import type { CatalogueGateway } from "../application/catalogue-gateway.ts";
import { AGE_RATINGS, type Movie } from "../domain/movie.ts";

const MovieOutput = z.object({
  id: z.number().int(),
  title: z.string(),
  releaseYear: z.number().int(),
  duration: z.number().int(),
  ageRating: z.enum(AGE_RATINGS),
  genres: z.array(z.object({ id: z.number().int(), name: z.string() })),
});

const MoviePageOutput = z.object({
  total: z.number().int(),
  lastPage: z.number().int(),
  items: z.array(MovieOutput),
});

const movieOf = ({ genres, ...movie }: z.infer<typeof MovieOutput>): Movie => ({
  ...movie,
  genres: genres.map((genre) => genre.name),
});

export const createHttpCatalogueGateway = ({
  apiUrl,
  fetch,
}: {
  readonly apiUrl: string;
  readonly fetch: Fetch;
}): CatalogueGateway => ({
  listMovies: async ({ page, limit }) => {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    const sent = await send(fetch, `${apiUrl}/movies?${query}`, { method: "GET" });
    if (!sent.ok) {
      return sent;
    }
    const response = sent.value;
    if (response.status !== OK) {
      return err(failureOf(response));
    }
    const body = await parseJson(response, MoviePageOutput);
    if (!body.ok) {
      return body;
    }
    const { total, lastPage, items } = body.value;
    return ok({ total, lastPage, movies: items.map(movieOf) });
  },
});
