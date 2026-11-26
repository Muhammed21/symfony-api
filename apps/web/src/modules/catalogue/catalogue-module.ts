import type { Fetch } from "../../platform/http.ts";
import { catalogueUseCases } from "./application/catalogue.ts";
import { createHttpCatalogueGateway } from "./infrastructure/http-catalogue-gateway.ts";

export const createCatalogue = (options: { readonly apiUrl: string; readonly fetch: Fetch }) =>
  catalogueUseCases({ gateway: createHttpCatalogueGateway(options) });
