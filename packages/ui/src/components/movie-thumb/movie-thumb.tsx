import styles from "./movie-thumb.module.css";

export type MovieThumbOrientation = "landscape" | "portrait";

export type MovieThumbProps = {
  readonly title: string;
  readonly image?: string;
  readonly orientation?: MovieThumbOrientation;
};

export const MovieThumb = ({ title, image, orientation = "landscape" }: MovieThumbProps) => (
  <div className={styles.thumb} data-orientation={orientation} data-testid="movie-thumb">
    {image === undefined ? (
      <span className={styles.placeholder}>{title}</span>
    ) : (
      <img className={styles.image} src={image} alt={title} />
    )}
  </div>
);
