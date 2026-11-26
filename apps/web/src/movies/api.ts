import { z } from 'zod'

const MovieSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  releaseYear: z.number().int(),
  duration: z.number().int(),
  ageRating: z.enum(['ALL', '7+', '13+', '16+', '18+']),
  genres: z.array(z.object({ id: z.number().int(), name: z.string() })),
})

const MoviePageSchema = z.object({
  total: z.number().int(),
  lastPage: z.number().int(),
  items: z.array(MovieSchema),
})

export type Movie = z.infer<typeof MovieSchema>
export type MoviePage = z.infer<typeof MoviePageSchema>

export const MOVIES_PER_PAGE = 12

export const fetchMoviePage = async ({ page }: { page: number }): Promise<MoviePage> => {
  const response = await fetch(`/api/movies?${new URLSearchParams({ page: String(page), limit: String(MOVIES_PER_PAGE) })}`)
  return MoviePageSchema.parse(await response.json())
}
