import { useState } from "react";

import styles from "./movie-thumb.module.css";

export type MovieThumbOrientation = "landscape" | "portrait";

export type MovieThumbProps = {
  readonly title: string;
  readonly image?: string;
  readonly captioned?: boolean;
  readonly orientation?: MovieThumbOrientation;
};

export const MovieThumb = ({
  title,
  image,
  captioned = false,
  orientation = "landscape",
}: MovieThumbProps) => {
  const [failed, setFailed] = useState(false);
  return (
    <div className={styles.thumb} data-orientation={orientation} data-testid="movie-thumb">
      {image === undefined || failed ? (
        <span className={styles.placeholder}>{title}</span>
      ) : (
        <>
          <img
            className={styles.image}
            src={image}
            alt={captioned ? "" : title}
            onError={() => setFailed(true)}
          />
          {captioned && (
            <span className={styles.caption}>
              <span className={styles.captionTitle}>{title}</span>
            </span>
          )}
        </>
      )}
    </div>
  );
};
