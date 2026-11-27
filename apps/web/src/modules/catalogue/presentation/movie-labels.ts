import type { AgeRating, Movie } from "../domain/movie.ts";

export const ageRatingLabel = (ageRating: AgeRating) =>
  ageRating === "ALL" ? "Tous publics" : ageRating;

export const eyebrowOf = ({ releaseYear, genres }: Pick<Movie, "releaseYear" | "genres">) =>
  [String(releaseYear), genres.join(", ")].filter((part) => part !== "").join(" · ");
