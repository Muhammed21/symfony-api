import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type AnyRootRoute,
  createRoute,
  Navigate,
  Link as RouterLink,
} from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { ButtonSymbol, ButtonTextAndSymbol, Link, TextField } from "@prime/ui";

import type { AccountFailure, Credentials } from "../domain/account.ts";
import type { AccountUseCases, LoadBackdrop } from "./use-cases.ts";
import { SESSION_QUERY_KEY, useSession } from "./use-session.ts";

import styles from "./account-route.module.css";

type Mode = "log_in" | "register";

type AccountSearch = {
  readonly mode?: "inscription";
  readonly redirect?: string;
};

const REGISTER_MODE = "inscription";

const HOME = "/";

const EXACT = { exact: true } as const;

const safeRedirect = (value: unknown): string | undefined =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : undefined;

const searchOf = ({
  mode,
  redirect,
}: {
  readonly mode: Mode;
  readonly redirect: string | undefined;
}): AccountSearch => ({
  ...(mode === "register" ? { mode: REGISTER_MODE } : {}),
  ...(redirect === undefined ? {} : { redirect }),
});

const TEXTS = {
  log_in: {
    title: "Se connecter",
    submit: "Se connecter",
    pending: "Connexion…",
    autoComplete: "current-password",
    otherQuestion: "Pas encore de compte ?",
    otherMode: "register",
  },
  register: {
    title: "Créer un compte",
    submit: "Créer mon compte",
    pending: "Création…",
    autoComplete: "new-password",
    otherQuestion: "Déjà un compte ?",
    otherMode: "log_in",
  },
} as const;

const ALERTS: Partial<Record<AccountFailure["kind"], string>> = {
  rejected: "E-mail ou mot de passe incorrect.",
  unavailable: "Le service est indisponible. Réessayez dans un instant.",
};

const EMAIL_TAKEN = "Un compte existe déjà avec cet e-mail.";

const fieldErrorsOf = (failure: AccountFailure | undefined) => {
  if (failure?.kind === "invalid") {
    return failure.fields;
  }
  return failure?.kind === "email_taken" ? { email: EMAIL_TAKEN } : {};
};

const Backdrop = ({ loadBackdrop }: { readonly loadBackdrop: LoadBackdrop }) => {
  const { data } = useQuery({
    queryKey: ["account-backdrop"],
    queryFn: async () => (await loadBackdrop()) ?? null,
  });
  return typeof data === "string" ? <img className={styles.backdrop} src={data} alt="" /> : null;
};

const AccountForm = ({
  mode,
  redirect,
  account,
}: {
  readonly mode: Mode;
  readonly redirect: string | undefined;
  readonly account: AccountUseCases;
}) => {
  const queryClient = useQueryClient();
  const titleId = useId();
  const form = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordShown, setPasswordShown] = useState(false);
  const [outcome, setOutcome] = useState<{
    readonly mode: Mode;
    readonly failure: AccountFailure;
  }>();
  const submission = useMutation({
    mutationFn: (credentials: Credentials) =>
      mode === "register" ? account.register(credentials) : account.logIn(credentials),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.setQueryData(SESSION_QUERY_KEY, result.value);
        return;
      }
      setOutcome({ mode, failure: result.error });
    },
  });
  const failure = outcome?.mode === mode ? outcome.failure : undefined;
  const fields = fieldErrorsOf(failure);
  const alert = failure === undefined ? undefined : ALERTS[failure.kind];
  const texts = TEXTS[mode];

  useEffect(() => {
    if (failure !== undefined) {
      form.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
    }
  }, [failure]);

  return (
    <form
      ref={form}
      className={styles.form}
      aria-labelledby={titleId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submission.mutate({ email, password });
      }}
    >
      <h1 id={titleId} className={styles.title}>
        {texts.title}
      </h1>
      <div className={styles.fields}>
        <TextField
          label="E-mail"
          labelVisible
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.fr"
          value={email}
          onChange={setEmail}
          {...(fields.email === undefined ? {} : { error: fields.email })}
        />
        {failure?.kind === "email_taken" && (
          <div className={styles.taken}>
            <Link
              label="Se connecter avec cet e-mail"
              size="small"
              appearance="plain"
              render={(anchor) => (
                <RouterLink
                  {...anchor}
                  to="/compte"
                  search={searchOf({ mode: "log_in", redirect })}
                  activeOptions={EXACT}
                />
              )}
            />
          </div>
        )}
        <TextField
          label="Mot de passe"
          labelVisible
          type={passwordShown ? "text" : "password"}
          autoComplete={texts.autoComplete}
          value={password}
          onChange={setPassword}
          accessory={
            <ButtonSymbol
              size="small"
              appearance="plain"
              label={passwordShown ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              symbol={passwordShown ? <EyeOff /> : <Eye />}
              onClick={() => setPasswordShown((shown) => !shown)}
            />
          }
          {...(mode === "register" ? { hint: "8 caractères minimum" } : {})}
          {...(fields.password === undefined ? {} : { error: fields.password })}
        />
      </div>
      {alert !== undefined && (
        <p role="alert" className={styles.alert}>
          {alert}
        </p>
      )}
      <div className={styles.submit}>
        <ButtonTextAndSymbol
          type="submit"
          size="large"
          appearance="prominent"
          label={submission.isPending ? texts.pending : texts.submit}
          symbol={<ArrowRight />}
          symbolPlacement="trailing"
          disabled={submission.isPending}
        />
      </div>
      <p className={styles.switch}>
        <span>{texts.otherQuestion}</span>
        <Link
          label={TEXTS[texts.otherMode].title}
          appearance="plain"
          render={(anchor) => (
            <RouterLink
              {...anchor}
              to="/compte"
              search={searchOf({ mode: texts.otherMode, redirect })}
              activeOptions={EXACT}
            />
          )}
        />
      </p>
    </form>
  );
};

export const accountRoute = ({
  parent,
  account,
  loadBackdrop,
}: {
  readonly parent: AnyRootRoute;
  readonly account: AccountUseCases;
  readonly loadBackdrop: LoadBackdrop;
}) => {
  const route = createRoute({
    getParentRoute: () => parent,
    path: "/compte",
    validateSearch: (search: Record<string, unknown>) => search,
    component: function AccountPage() {
      const search = route.useSearch();
      const mode = search["mode"];
      const redirect = safeRedirect(search["redirect"]);
      const session = useSession(account);
      if (session.data !== null) {
        return <Navigate to={redirect ?? HOME} />;
      }
      return (
        <div className={styles.page}>
          <div className={styles.visual}>
            <Backdrop loadBackdrop={loadBackdrop} />
          </div>
          <div className={styles.side}>
            <AccountForm
              mode={mode === REGISTER_MODE ? "register" : "log_in"}
              redirect={redirect}
              account={account}
            />
          </div>
        </div>
      );
    },
  });
  return route;
};
