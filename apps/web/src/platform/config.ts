import { z } from "zod";

export type Config =
  | { readonly kind: "ready"; readonly apiUrl: string }
  | { readonly kind: "invalid"; readonly message: string };

const ApiUrl = z.union([z.url({ protocol: /^https?$/ }), z.string().regex(/^\/(?!\/)/)]);

export const configOf = ({ env }: { readonly env: Readonly<Record<string, unknown>> }): Config => {
  const apiUrl = ApiUrl.safeParse(env["VITE_API_URL"]);
  return apiUrl.success
    ? { kind: "ready", apiUrl: apiUrl.data }
    : {
        kind: "invalid",
        message:
          "Configuration invalide : VITE_API_URL manque ou n'est ni une URL http(s) ni un chemin (voir .env.example).",
      };
};
