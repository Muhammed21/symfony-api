import { type ReactNode, useId } from "react";

import styles from "./text-field.module.css";

export type TextFieldType = "text" | "search" | "email" | "password";

export type TextFieldInputMode = "text" | "numeric";

export type TextFieldProps = {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly type?: TextFieldType;
  readonly inputMode?: TextFieldInputMode;
  readonly maxLength?: number;
  readonly autoComplete?: string;
  readonly symbol?: ReactNode;
  readonly accessory?: ReactNode;
  readonly labelVisible?: boolean;
  readonly hint?: string;
  readonly error?: string;
};

const joined = (ids: readonly (string | false)[]) => {
  const present = ids.filter((id) => id !== false);
  return present.length === 0 ? undefined : present.join(" ");
};

export const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  type,
  inputMode,
  maxLength,
  autoComplete,
  symbol,
  accessory,
  labelVisible = false,
  hint,
  error,
}: TextFieldProps) => {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <div className={styles.field}>
      {labelVisible && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}
      <div
        className={styles.frame}
        data-symbol={symbol !== undefined}
        data-invalid={error !== undefined}
      >
        {symbol !== undefined && (
          <span aria-hidden="true" className={styles.symbol}>
            {symbol}
          </span>
        )}
        <input
          id={id}
          className={styles.input}
          aria-label={labelVisible ? undefined : label}
          aria-invalid={error === undefined ? undefined : true}
          aria-describedby={joined([error !== undefined && errorId, hint !== undefined && hintId])}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          inputMode={inputMode}
          maxLength={maxLength}
          autoComplete={autoComplete}
        />
        {accessory}
      </div>
      {error !== undefined && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
      {hint !== undefined && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
};
