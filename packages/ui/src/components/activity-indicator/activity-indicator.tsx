import styles from "./activity-indicator.module.css";

export type ActivityIndicatorSize = "small" | "medium" | "large";

export type ActivityIndicatorProps = {
  readonly size?: ActivityIndicatorSize;
  readonly label?: string;
};

const SPOKES = 8;

const TURN = 360;

const spokes = Array.from({ length: SPOKES }, (_, index) => ({
  angle: (TURN / SPOKES) * index,
  opacity: (index + 1) / SPOKES,
}));

export const ActivityIndicator = ({
  size = "medium",
  label = "Chargement",
}: ActivityIndicatorProps) => (
  <svg
    role="progressbar"
    aria-label={label}
    className={styles.indicator}
    data-size={size}
    viewBox="0 0 24 24"
  >
    {spokes.map(({ angle, opacity }) => (
      <line
        key={angle}
        x1="12"
        y1="2.5"
        x2="12"
        y2="7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity={opacity}
        transform={`rotate(${angle} 12 12)`}
      />
    ))}
  </svg>
);
