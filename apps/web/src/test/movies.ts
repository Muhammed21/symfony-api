export type MovieFixture = {
  id: number
  title: string
  releaseYear: number
  duration: number
  ageRating: string
  genres: ReadonlyArray<{ id: number; name: string }>
}

export const aMovie = (overrides: Partial<MovieFixture> = {}): MovieFixture => ({
  id: 1,
  title: 'Les Évadés',
  releaseYear: 1994,
  duration: 142,
  ageRating: '13+',
  genres: [{ id: 6, name: 'Drame' }],
  ...overrides,
})

export const aMoviePage = ({
  items = [aMovie()],
  total = items.length,
  lastPage = 1,
}: { items?: ReadonlyArray<MovieFixture>; total?: number; lastPage?: number } = {}) => ({
  total,
  lastPage,
  items,
})
