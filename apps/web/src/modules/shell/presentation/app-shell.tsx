import { Link as RouterLink, Outlet, useRouterState } from "@tanstack/react-router";
import { House, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { TabBar } from "@prime/ui";

import { PrimeVideoLogo } from "./prime-video-logo.tsx";

import styles from "./app-shell.module.css";

const CATALOGUE = "/catalogue";

const useScrolled = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 0);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return scrolled;
};

export const AppShell = () => {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const scrolled = useScrolled();
  return (
    <div className={styles.page}>
      <header className={styles.navigationBar} data-scrolled={scrolled ? true : undefined}>
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
        <div key={pathname} className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
