import type { ReactNode } from "react";

import styles from "./text-field.module.css";

export type TextFieldType = "text" | "search";

export type TextFieldInputMode = "text" | "numeric";

export type TextFieldProps = {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly type?: TextFieldType;
  readonly inputMode?: TextFieldInputMode;
  readonly maxLength?: number;
  readonly symbol?: ReactNode;
};

export const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  type,
  inputMode,
  maxLength,
  symbol,
}: TextFieldProps) => (
  <div className={styles.frame} data-symbol={symbol !== undefined}>
    {symbol !== undefined && (
      <span aria-hidden="true" className={styles.symbol}>
        {symbol}
      </span>
    )}
    <input
      className={styles.input}
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type={type}
      inputMode={inputMode}
      maxLength={maxLength}
    />
  </div>
);
