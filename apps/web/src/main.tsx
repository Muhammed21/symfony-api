import "@prime/ui/theme.css";
import "./platform/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { createAccount } from "./modules/account/account-module.ts";
import { AccountButton } from "./modules/account/presentation/account-button.tsx";
import { accountRoute } from "./modules/account/presentation/account-route.tsx";
import { createCatalogue } from "./modules/catalogue/catalogue-module.ts";
import { catalogueRoute } from "./modules/catalogue/presentation/catalogue-route.tsx";
import { homeRoute } from "./modules/catalogue/presentation/home-route.tsx";
import { trailerRoute } from "./modules/catalogue/presentation/trailer-route.tsx";
import { AppShell } from "./modules/shell/presentation/app-shell.tsx";
import { configOf } from "./platform/config.ts";

const fetchFromBrowser = (url: string, init: RequestInit) => window.fetch(url, init);

const appRouter = ({
  apiUrl,
  queryClient,
}: {
  readonly apiUrl: string;
  readonly queryClient: QueryClient;
}) => {
  const catalogue = createCatalogue({ apiUrl, fetch: fetchFromBrowser });

  const account = createAccount({
    apiUrl,
    fetch: fetchFromBrowser,
    storage: window.localStorage,
    now: Date.now,
  });
  const loadBackdrop = async () => {
    const recent = await queryClient.query({
      queryKey: ["movies", 1, {}, "recent"],
      queryFn: () => catalogue.listMovies({ page: 1, filters: {}, sort: "recent" }),
      staleTime: "static",
    });
    return recent.ok ? recent.value.movies[0]?.backdropUrl : undefined;
  };

  const root = createRootRoute({
    component: () => <AppShell account={<AccountButton account={account} />} />,
  });
  const routeOptions = {
    parent: root,
    listMovies: catalogue.listMovies,
    listGenres: catalogue.listGenres,
  };
  return createRouter({
    routeTree: root.addChildren([
      homeRoute(routeOptions),
      catalogueRoute(routeOptions),
      trailerRoute({ parent: root, getMovie: catalogue.getMovie }),
      accountRoute({ parent: root, account, loadBackdrop }),
    ]),
  });
};

const config = configOf({ env: import.meta.env });
const container = document.getElementById("root");
const queryClient = new QueryClient();

if (container !== null) {
  createRoot(container).render(
    <StrictMode>
      {config.kind === "ready" ? (
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={appRouter({ apiUrl: config.apiUrl, queryClient })} />
        </QueryClientProvider>
      ) : (
        <p role="alert">{config.message}</p>
      )}
    </StrictMode>,
  );
}
