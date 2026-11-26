import "@prime/ui/theme.css";
import "./platform/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { createCatalogue } from "./modules/catalogue/catalogue-module.ts";
import { moviesRoute } from "./modules/catalogue/presentation/movies-route.tsx";
import { configOf } from "./platform/config.ts";

const fetchFromBrowser = (url: string, init: RequestInit) => window.fetch(url, init);

const appRouter = ({ apiUrl }: { readonly apiUrl: string }) => {
  const catalogue = createCatalogue({ apiUrl, fetch: fetchFromBrowser });

  const root = createRootRoute();
  return createRouter({
    routeTree: root.addChildren([moviesRoute({ parent: root, listMovies: catalogue.listMovies })]),
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
          <RouterProvider router={appRouter({ apiUrl: config.apiUrl })} />
        </QueryClientProvider>
      ) : (
        <p role="alert">{config.message}</p>
      )}
    </StrictMode>,
  );
}
