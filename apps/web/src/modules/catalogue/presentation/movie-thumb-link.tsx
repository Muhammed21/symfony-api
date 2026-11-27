import { Link as RouterLink } from "@tanstack/react-router";

import { MovieThumb } from "@prime/ui";

import { type SimilarMovie, thumbnailOf } from "../domain/movie.ts";

import styles from "./movie-thumb-link.module.css";

export const MovieThumbLink = ({ movie }: { readonly movie: SimilarMovie }) => {
  const thumbnail = thumbnailOf(movie);
  return (
    <RouterLink
      className={styles.link}
      to="/films/$movieId/bande-annonce"
      params={{ movieId: String(movie.id) }}
      aria-label={movie.title}
    >
      <MovieThumb
        title={movie.title}
        captioned
        {...(thumbnail === undefined ? {} : { image: thumbnail })}
      />
    </RouterLink>
  );
};
