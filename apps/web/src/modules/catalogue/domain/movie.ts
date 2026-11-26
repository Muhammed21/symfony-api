export const AGE_RATINGS = ["ALL", "7+", "13+", "16+", "18+"] as const;

export type AgeRating = (typeof AGE_RATINGS)[number];

export type Movie = {
  readonly id: number;
  readonly title: string;
  readonly releaseYear: number;
  readonly duration: number;
  readonly ageRating: AgeRating;
  readonly genres: readonly string[];
};

export type MoviePage = {
  readonly movies: readonly Movie[];
  readonly total: number;
  readonly lastPage: number;
};

export type CatalogueFailure = "unavailable" | "invalid_response";
