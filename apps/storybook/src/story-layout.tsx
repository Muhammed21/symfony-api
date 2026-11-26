import type { ReactNode } from "react";

export const Row = ({ children }: { readonly children: ReactNode }) => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "var(--prime-space-l)",
    }}
  >
    {children}
  </div>
);

export const Column = ({ children }: { readonly children: ReactNode }) => (
  <div style={{ display: "grid", gap: "var(--prime-space-2xl)" }}>{children}</div>
);
