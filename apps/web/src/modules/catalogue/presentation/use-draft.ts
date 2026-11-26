import { useEffect, useState } from "react";

const SETTLE_DELAY = 300;

export const useDraft = <Value>({
  committed,
  interpret,
  format,
  commit,
}: {
  readonly committed: Value;
  readonly interpret: (text: string) => Value;
  readonly format: (value: Value) => string;
  readonly commit: (value: Value) => void;
}) => {
  const [text, setText] = useState(() => format(committed));
  const [sent, setSent] = useState(committed);
  const [seen, setSeen] = useState(committed);

  if (committed !== seen) {
    setSeen(committed);
    if (committed !== sent) {
      setSent(committed);
      setText(format(committed));
    }
  }

  useEffect(() => {
    const next = interpret(text);
    if (next === sent) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setSent(next);
      commit(next);
    }, SETTLE_DELAY);
    return () => clearTimeout(timer);
  }, [text, sent, interpret, commit]);

  return [text, setText] as const;
};
