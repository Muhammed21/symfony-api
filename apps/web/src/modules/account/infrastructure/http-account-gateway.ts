import { z } from "zod";

import { err, ok, type Result } from "@prime/result";

import { type Fetch, OK, parseJson, send } from "../../../platform/http.ts";
import type { AccountGateway } from "../application/account-gateway.ts";
import type { AccountFailure, Credentials, FieldErrors } from "../domain/account.ts";

const CREATED = 201;
const UNAUTHORIZED = 401;
const CONFLICT = 409;
const UNPROCESSABLE = 422;

const CREDENTIAL_FIELDS = ["email", "password"] as const;

const TokenOutput = z.object({ token: z.string().min(1) });

const UserOutput = z.object({ email: z.string() });

const ViolationsOutput = z.object({
  violations: z.array(z.object({ propertyPath: z.string(), title: z.string() })),
});

const UNAVAILABLE: AccountFailure = { kind: "unavailable" };

const fieldErrorsOf = ({ violations }: z.infer<typeof ViolationsOutput>): FieldErrors =>
  Object.fromEntries(
    CREDENTIAL_FIELDS.flatMap((field) => {
      const violation = violations.find(({ propertyPath }) => propertyPath === field);
      return violation === undefined ? [] : [[field, violation.title]];
    }),
  );

const invalidFieldsOf = async (response: Response): Promise<AccountFailure> => {
  const body = await parseJson(response, ViolationsOutput);
  if (!body.ok) {
    return UNAVAILABLE;
  }
  const fields = fieldErrorsOf(body.value);
  return Object.keys(fields).length === 0 ? UNAVAILABLE : { kind: "invalid", fields };
};

export const createHttpAccountGateway = ({
  apiUrl,
  fetch,
}: {
  readonly apiUrl: string;
  readonly fetch: Fetch;
}): AccountGateway => {
  const post = (path: string, { email, password }: Credentials) =>
    send(fetch, `${apiUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
    });

  return {
    logIn: async (credentials): Promise<Result<string, AccountFailure>> => {
      const sent = await post("/login", credentials);
      if (!sent.ok) {
        return err(UNAVAILABLE);
      }
      const response = sent.value;
      if (response.status === UNAUTHORIZED) {
        return err({ kind: "rejected" });
      }
      if (response.status !== OK) {
        return err(UNAVAILABLE);
      }
      const body = await parseJson(response, TokenOutput);
      return body.ok ? ok(body.value.token) : err(UNAVAILABLE);
    },
    register: async (credentials): Promise<Result<undefined, AccountFailure>> => {
      const sent = await post("/register", credentials);
      if (!sent.ok) {
        return err(UNAVAILABLE);
      }
      const response = sent.value;
      if (response.status === CREATED) {
        return ok(undefined);
      }
      if (response.status === CONFLICT) {
        return err({ kind: "email_taken" });
      }
      return err(response.status === UNPROCESSABLE ? await invalidFieldsOf(response) : UNAVAILABLE);
    },
    me: async (token) => {
      const sent = await send(fetch, `${apiUrl}/me`, {
        method: "GET",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      if (!sent.ok) {
        return err("unavailable");
      }
      const response = sent.value;
      if (response.status === UNAUTHORIZED) {
        return err("unauthorized");
      }
      const body = response.status === OK ? await parseJson(response, UserOutput) : undefined;
      return body?.ok === true ? ok(body.value) : err("unavailable");
    },
  };
};
