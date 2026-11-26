import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

import { err, ok, type Result } from "@prime/result";

import type { AccountFailure, Credentials, Session } from "../../domain/account.ts";
import { accountRoute } from "../account-route.tsx";
import type { AccountUseCases, LoadBackdrop } from "../use-cases.ts";

const SESSION: Session = { token: "jeton", email: "ada@exemple.fr" };

type Answer = Result<Session, AccountFailure>;

const NEVER_ANSWERED = new Promise<Answer>(() => {});

const fakeAccount = ({
  answer = ok(SESSION),
  session,
}: {
  readonly answer?: Answer | Promise<Answer>;
  readonly session?: Session;
} = {}) => {
  const asked: { readonly use: "logIn" | "register"; readonly credentials: Credentials }[] = [];
  const account: AccountUseCases = {
    logIn: (credentials) => {
      asked.push({ use: "logIn", credentials });
      return Promise.resolve(answer);
    },
    register: (credentials) => {
      asked.push({ use: "register", credentials });
      return Promise.resolve(answer);
    },
    currentSession: () => session,
    verifySession: () => Promise.resolve(session),
    logOut: () => undefined,
  };
  return { account, asked };
};

const noBackdrop: LoadBackdrop = () => Promise.resolve(undefined);

const renderAccount = async ({
  url = "/compte",
  account = fakeAccount().account,
  loadBackdrop = noBackdrop,
}: {
  readonly url?: string;
  readonly account?: AccountUseCases;
  readonly loadBackdrop?: LoadBackdrop;
} = {}) => {
  const root = createRootRoute();
  const stub = (path: string, text: string) =>
    createRoute({ getParentRoute: () => root, path, component: () => <p>{text}</p> });
  const router = createRouter({
    routeTree: root.addChildren([
      accountRoute({ parent: root, account, loadBackdrop }),
      stub("/", "Page d'accueil"),
      stub("/catalogue", "Page du catalogue"),
    ]),
    history: createMemoryHistory({ initialEntries: [url] }),
  });
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { screen, router };
};

type Screen = Awaited<ReturnType<typeof renderAccount>>["screen"];

const emailField = (screen: Screen) => screen.getByRole("textbox", { name: "E-mail" });

const passwordField = (screen: Screen) => screen.getByLabelText("Mot de passe", { exact: true });

const fillIn = async (screen: Screen, { email, password }: Credentials) => {
  await emailField(screen).fill(email);
  await passwordField(screen).fill(password);
};

const ADA = { email: "ada@exemple.fr", password: "un-bon-mot-de-passe" };

describe("page de connexion et de création de compte (spec 12)", () => {
  it("par défaut, propose de se connecter", async () => {
    const { screen } = await renderAccount();

    await expect
      .element(screen.getByRole("heading", { level: 1, name: "Se connecter" }))
      .toBeVisible();
    await expect.element(screen.getByText("Pas encore de compte ?")).toBeVisible();
    await expect.element(screen.getByRole("link", { name: "Créer un compte" })).toBeVisible();
    await expect
      .element(screen.getByRole("link", { name: "Se connecter" }))
      .not.toBeInTheDocument();
    await expect.element(emailField(screen)).toHaveAttribute("autocomplete", "email");
    await expect.element(passwordField(screen)).toHaveAttribute("type", "password");
    await expect.element(passwordField(screen)).toHaveAttribute("autocomplete", "current-password");
    await expect.element(screen.getByRole("button", { name: "Se connecter" })).toBeVisible();
    await expect.element(emailField(screen)).toHaveValue("");
    await expect.element(passwordField(screen)).toHaveValue("");
    await expect
      .element(screen.getByRole("link", { name: "Se connecter avec cet e-mail" }))
      .not.toBeInTheDocument();
    expect(screen.container.querySelector("img")).toBeNull();
  });

  it("en mode inscription, propose de créer un compte", async () => {
    const { screen } = await renderAccount({ url: "/compte?mode=inscription" });

    await expect
      .element(screen.getByRole("heading", { level: 1, name: "Créer un compte" }))
      .toBeVisible();
    await expect.element(screen.getByText("Déjà un compte ?")).toBeVisible();
    await expect.element(screen.getByRole("link", { name: "Se connecter" })).toBeVisible();
    await expect
      .element(screen.getByRole("link", { name: "Créer un compte" }))
      .not.toBeInTheDocument();
    await expect.element(passwordField(screen)).toHaveAttribute("autocomplete", "new-password");
    await expect.element(passwordField(screen)).toHaveAccessibleDescription("8 caractères minimum");
    await expect.element(screen.getByRole("button", { name: "Créer mon compte" })).toBeVisible();
  });

  it("change de mode en gardant l'e-mail saisi et en effaçant les erreurs", async () => {
    const { account } = fakeAccount({ answer: err({ kind: "rejected" }) });
    const { screen, router } = await renderAccount({ account });
    await fillIn(screen, ADA);
    await screen.getByRole("button", { name: "Se connecter" }).click();
    await expect.element(screen.getByRole("alert")).toBeVisible();

    await screen.getByRole("link", { name: "Créer un compte" }).click();

    await expect
      .element(screen.getByRole("heading", { level: 1, name: "Créer un compte" }))
      .toBeVisible();
    expect(router.state.location.search).toEqual({ mode: "inscription" });
    await expect.element(emailField(screen)).toHaveValue("ada@exemple.fr");
    await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
  });

  it("garde la page de retour en changeant de mode", async () => {
    const { screen, router } = await renderAccount({ url: "/compte?redirect=%2Fcatalogue" });

    await screen.getByRole("link", { name: "Créer un compte" }).click();
    await expect
      .element(screen.getByRole("heading", { level: 1, name: "Créer un compte" }))
      .toBeVisible();
    expect(router.state.location.search).toEqual({ mode: "inscription", redirect: "/catalogue" });

    await screen.getByRole("link", { name: "Se connecter" }).click();
    await expect
      .element(screen.getByRole("heading", { level: 1, name: "Se connecter" }))
      .toBeVisible();
    expect(router.state.location.search).toEqual({ redirect: "/catalogue" });
  });

  it("connecte avec les identifiants saisis, puis ramène à l'accueil", async () => {
    const { account, asked } = fakeAccount();
    const { screen, router } = await renderAccount({ account });

    await fillIn(screen, ADA);
    await screen.getByRole("button", { name: "Se connecter" }).click();

    await expect.element(screen.getByText("Page d'accueil")).toBeVisible();
    expect(asked).toEqual([{ use: "logIn", credentials: ADA }]);
    expect(router.state.location.pathname).toBe("/");
  });

  it("crée le compte en mode inscription", async () => {
    const { account, asked } = fakeAccount();
    const { screen } = await renderAccount({ url: "/compte?mode=inscription", account });

    await fillIn(screen, ADA);
    await screen.getByRole("button", { name: "Créer mon compte" }).click();

    await expect.element(screen.getByText("Page d'accueil")).toBeVisible();
    expect(asked).toEqual([{ use: "register", credentials: ADA }]);
  });

  it("ramène à la page demandée, si elle fait partie de l'application", async () => {
    const { screen, router } = await renderAccount({ url: "/compte?redirect=%2Fcatalogue" });

    await fillIn(screen, ADA);
    await screen.getByRole("button", { name: "Se connecter" }).click();

    await expect.element(screen.getByText("Page du catalogue")).toBeVisible();
    expect(router.state.location.pathname).toBe("/catalogue");
  });

  it.each(["https://ailleurs.fr", "//ailleurs.fr"])(
    "ignore une page de retour extérieure à l'application : %s",
    async (redirect) => {
      const { screen, router } = await renderAccount({
        url: `/compte?redirect=${encodeURIComponent(redirect)}`,
      });

      await fillIn(screen, ADA);
      await screen.getByRole("button", { name: "Se connecter" }).click();

      await expect.element(screen.getByText("Page d'accueil")).toBeVisible();
      expect(router.state.location.pathname).toBe("/");
    },
  );

  it("montre chaque erreur sous son champ et met le focus sur le premier champ fautif", async () => {
    const { account } = fakeAccount({
      answer: err({
        kind: "invalid",
        fields: { email: "Saisissez votre e-mail.", password: "Saisissez votre mot de passe." },
      }),
    });
    const { screen } = await renderAccount({ account });

    await screen.getByRole("button", { name: "Se connecter" }).click();

    await expect.element(emailField(screen)).toHaveAttribute("aria-invalid", "true");
    await expect.element(emailField(screen)).toHaveAccessibleDescription("Saisissez votre e-mail.");
    await expect
      .element(passwordField(screen))
      .toHaveAccessibleDescription("Saisissez votre mot de passe.");
    await expect.element(emailField(screen)).toHaveFocus();
  });

  it("met le focus sur le mot de passe quand lui seul est fautif", async () => {
    const { account } = fakeAccount({
      answer: err({
        kind: "invalid",
        fields: { password: "Le mot de passe doit contenir au moins 8 caractères." },
      }),
    });
    const { screen } = await renderAccount({ url: "/compte?mode=inscription", account });
    await fillIn(screen, { email: "ada@exemple.fr", password: "court" });

    await screen.getByRole("button", { name: "Créer mon compte" }).click();

    await expect.element(passwordField(screen)).toHaveFocus();
    await expect.element(emailField(screen)).not.toHaveAttribute("aria-invalid");
  });

  it("signale des identifiants refusés sans quitter la page", async () => {
    const { account } = fakeAccount({ answer: err({ kind: "rejected" }) });
    const { screen } = await renderAccount({ account });

    await fillIn(screen, ADA);
    await screen.getByRole("button", { name: "Se connecter" }).click();

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("E-mail ou mot de passe incorrect.");
    await expect.element(emailField(screen)).toHaveValue("ada@exemple.fr");
    await expect.element(emailField(screen)).not.toHaveAttribute("aria-invalid");
  });

  it("signale un service indisponible", async () => {
    const { account } = fakeAccount({ answer: err({ kind: "unavailable" }) });
    const { screen } = await renderAccount({ account });

    await fillIn(screen, ADA);
    await screen.getByRole("button", { name: "Se connecter" }).click();

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Le service est indisponible. Réessayez dans un instant.");
  });

  it("signale un e-mail déjà pris, avec un lien pour se connecter", async () => {
    const { account } = fakeAccount({ answer: err({ kind: "email_taken" }) });
    const { screen, router } = await renderAccount({
      url: "/compte?mode=inscription&redirect=%2Fcatalogue",
      account,
    });
    await fillIn(screen, ADA);

    await screen.getByRole("button", { name: "Créer mon compte" }).click();

    await expect
      .element(emailField(screen))
      .toHaveAccessibleDescription("Un compte existe déjà avec cet e-mail.");
    await expect
      .element(screen.getByRole("link", { name: "Se connecter avec cet e-mail" }))
      .not.toHaveAttribute("aria-current");
    await expect
      .element(screen.getByRole("link", { name: "Se connecter avec cet e-mail" }))
      .toHaveStyle({ backgroundColor: "rgba(0, 0, 0, 0)" });
    await screen.getByRole("link", { name: "Se connecter avec cet e-mail" }).click();
    await expect
      .element(screen.getByRole("heading", { level: 1, name: "Se connecter" }))
      .toBeVisible();
    expect(router.state.location.search).toEqual({ redirect: "/catalogue" });
  });

  it("pendant l'envoi, désactive le bouton et l'annonce", async () => {
    const { account } = fakeAccount({ answer: NEVER_ANSWERED });
    const { screen } = await renderAccount({ account });

    await fillIn(screen, ADA);
    await screen.getByRole("button", { name: "Se connecter" }).click();

    await expect.element(screen.getByRole("button", { name: "Connexion…" })).toBeDisabled();
  });

  it("annonce la création pendant l'envoi en mode inscription", async () => {
    const { account } = fakeAccount({ answer: NEVER_ANSWERED });
    const { screen } = await renderAccount({ url: "/compte?mode=inscription", account });

    await fillIn(screen, ADA);
    await screen.getByRole("button", { name: "Créer mon compte" }).click();

    await expect.element(screen.getByRole("button", { name: "Création…" })).toBeDisabled();
  });

  it("affiche puis masque le mot de passe", async () => {
    const { screen } = await renderAccount();

    await screen.getByRole("button", { name: "Afficher le mot de passe" }).click();
    await expect.element(passwordField(screen)).toHaveAttribute("type", "text");

    await screen.getByRole("button", { name: "Masquer le mot de passe" }).click();
    await expect.element(passwordField(screen)).toHaveAttribute("type", "password");
  });

  it("déjà connecté, ramène à l'accueil", async () => {
    const { account } = fakeAccount({ session: SESSION });
    const { screen } = await renderAccount({ account });

    await expect.element(screen.getByText("Page d'accueil")).toBeVisible();
  });

  it("occupe toute la page : la bannière nette à gauche, le formulaire à droite, sans panneau", async () => {
    await page.viewport(1280, 800);
    const { screen } = await renderAccount({
      loadBackdrop: () => Promise.resolve("https://images.exemple.fr/banniere.jpg"),
    });
    const form = screen.getByRole("form", { name: "Se connecter" });
    await expect.element(form).toBeVisible();
    await expect
      .poll(() => screen.container.querySelector("img")?.getAttribute("src"))
      .toBe("https://images.exemple.fr/banniere.jpg");
    const backdrop = screen.container.querySelector("img");

    expect(backdrop?.getAttribute("alt")).toBe("");
    expect(backdrop === null ? "" : getComputedStyle(backdrop).filter).toBe("none");
    expect(backdrop?.getBoundingClientRect().left).toBe(0);
    expect(backdrop?.getBoundingClientRect().height).toBe(800);
    expect(form.element().getBoundingClientRect().left).toBeGreaterThan(640);
    await expect.element(form).toHaveStyle({
      backgroundColor: "rgba(0, 0, 0, 0)",
      backdropFilter: "none",
      borderTopLeftRadius: "0px",
    });
  });

  it("détache les champs du fond noir", async () => {
    const { screen } = await renderAccount();
    const field = emailField(screen).element().parentElement;

    expect(field === null ? "" : getComputedStyle(field).backgroundColor).toBe(
      "rgba(255, 255, 255, 0.12)",
    );
  });

  it("sur téléphone, ne garde que le formulaire, sans défilement horizontal", async () => {
    await page.viewport(390, 844);
    const { screen } = await renderAccount({
      loadBackdrop: () => Promise.resolve("https://images.exemple.fr/banniere.jpg"),
    });
    await expect.element(screen.getByRole("form", { name: "Se connecter" })).toBeVisible();
    await expect.poll(() => screen.container.querySelector("img")).not.toBeNull();

    expect(screen.container.querySelector("img")?.checkVisibility()).toBe(false);
    expect(document.documentElement.scrollWidth).toBe(390);
  });

  it("étire le bouton d'envoi sur toute la largeur des champs, flèche après le texte", async () => {
    const { screen } = await renderAccount();
    const submit = screen.getByRole("button", { name: "Se connecter" }).element();

    expect(submit.getBoundingClientRect().width).toBe(
      emailField(screen).element().closest("label, div")?.getBoundingClientRect().width,
    );
    expect(submit.firstChild?.textContent).toBe("Se connecter");
    expect(getComputedStyle(submit).backgroundColor).toBe("rgba(255, 255, 255, 0.96)");
  });
});
