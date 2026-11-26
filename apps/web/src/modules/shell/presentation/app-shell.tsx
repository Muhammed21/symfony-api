import { Link as RouterLink, Outlet, useRouterState } from "@tanstack/react-router";
import { House, Search } from "lucide-react";

import { TabBar } from "@prime/ui";

import { PrimeVideoLogo } from "./prime-video-logo.tsx";

import styles from "./app-shell.module.css";

const CATALOGUE = "/catalogue";

export const AppShell = () => {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <div className={styles.page}>
      <header className={styles.navigationBar}>
        <RouterLink to="/" aria-label="Prime Video" className={styles.logo}>
          <PrimeVideoLogo />
        </RouterLink>
        <TabBar
          label="Navigation principale"
          orientation="horizontal"
          tabs={[
            {
              label: "Accueil",
              symbol: <House />,
              current: pathname === "/",
              render: (anchor) => <RouterLink {...anchor} to="/" />,
            },
            {
              label: "Catalogue",
              symbol: <Search />,
              current: pathname.startsWith(CATALOGUE),
              render: (anchor) => <RouterLink {...anchor} to={CATALOGUE} />,
            },
          ]}
        />
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
};
