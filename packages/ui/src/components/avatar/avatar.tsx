import styles from "./avatar.module.css";

export type AvatarSize = "small" | "medium";

export type AvatarProps = {
  readonly initial: string;
  readonly size?: AvatarSize;
};

export const Avatar = ({ initial, size = "small" }: AvatarProps) => (
  <span aria-hidden="true" className={styles.avatar} data-size={size}>
    {initial}
  </span>
);
