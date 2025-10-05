import type { ReactNode } from "react";

export function CarbonProviders({
  children,
  theme = "g10",
}: {
  children: ReactNode;
  theme?: "white" | "g10" | "g90" | "g100";
}) {
  return (
    <div className={`cds--${theme}`} data-carbon-theme={theme}>
      {children}
    </div>
  );
}
