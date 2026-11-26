import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";

import { ok } from "@prime/result";

import type { Session } from "../../domain/account.ts";
import { AccountButton } from "../account-button.tsx";
import { accountRoute } from "../account-route.tsx";
import type { AccountUseCases } from "../use-cases.ts";

const SESSION: Session = { token: "jeton", email: "ada@exemple.fr" };

const fakeAccount = ({
  stored,
  accepted = true,
}: {
  readonly stored?: Session;
  readonly accepted?: boolean;
} = {}) => {
  const state = { session: stored, loggedOut: 0 };
  const account: AccountUseCases = {
    logIn: (credentials) => {
      state.session = { token: "jeton", email: credentials.email };
      return Promise.resolve(ok(state.session));
    },
    register: (credentials) => Promise.resolve(ok({ token: "jeton", email: credentials.email })),
    currentSession: () => state.session,
    verifySession: () => Promise.resolve(accepted ? state.session : undefined),
    logOut: () => {
      state.loggedOut += 1;
      state.session = undefined;
    },
  };
  return { account, state };
};

const renderButton = async ({
  account = fakeAccount().account,
  url = "/",
}: { readonly account?: AccountUseCases; readonly url?: string } = {}) => {
  const root = createRootRoute({
    component: () => (
      <>
        <header>
          <AccountButton account={account} />
        </header>
        <main>
          <Outlet />
        </main>
      </>
    ),
  });
  const stub = (path: string, text: string) =>
    createRoute({ getParentRoute: () => root, path, component: () => <p>{text}</p> });
  const router = createRouter({
    routeTree: root.addChildren([
      stub("/", "Page d'accueil"),
      stub("/catalogue", "Page du catalogue"),
      accountRoute({ parent: root, account, loadBackdrop: () => Promise.resolve(undefined) }),
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

type Screen = Awaited<ReturnType<typeof renderButton>>["screen"];

const rectOf = (element: Element) => element.getBoundingClientRect();

const accountMenuButton = (screen: Screen) =>
  screen.getByRole("button", { name: "Compte de ada@exemple.fr" });

describe("bouton de compte de la barre (spec 12)", () => {
  it("déconnecté, propose de se connecter et de revenir à la page courante", async () => {
    const { screen, router } = await renderButton({ url: "/catalogue?page=2" });
    const link = screen.getByRole("banner").getByRole("link", { name: "Se connecter" });

    await expect.element(link).toHaveAttribute("href", "/compte?redirect=%2Fcatalogue%3Fpage%3D2");
    await link.click();

    await expect
      .element(screen.getByRole("heading", { level: 1, name: "Se connecter" }))
      .toBeVisible();
    expect(router.state.location.pathname).toBe("/compte");
  });

  it("déconnecté, montre une icône de profil ronde de 44 px, sans texte, à la taille de l'avatar", async () => {
    const { screen } = await renderButton();
    const link = screen.getByRole("link", { name: "Se connecter" });

    await expect.element(link).toHaveStyle({
      width: "44px",
      height: "44px",
      borderTopLeftRadius: "9999px",
      backgroundColor: "rgba(255, 255, 255, 0.96)",
      color: "rgb(0, 0, 0)",
    });
    expect(link.element().textContent).toBe("");
    expect(link.element().querySelector("svg")).not.toBeNull();
  });

  it("connecté, montre l'avatar à l'initiale de l'e-mail, menu fermé", async () => {
    const { account } = fakeAccount({ stored: SESSION });
    const { screen } = await renderButton({ account });

    await expect.element(accountMenuButton(screen)).toHaveAttribute("aria-expanded", "false");
    await expect.element(accountMenuButton(screen)).toHaveTextContent("A");
    await expect
      .element(screen.getByRole("link", { name: "Se connecter" }))
      .not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: "Se déconnecter" }))
      .not.toBeInTheDocument();
  });

  it("ouvre le menu du compte : l'e-mail puis Se déconnecter", async () => {
    const { account } = fakeAccount({ stored: SESSION });
    const { screen } = await renderButton({ account });

    await accountMenuButton(screen).click();

    await expect.element(accountMenuButton(screen)).toHaveAttribute("aria-expanded", "true");
    const menu = screen.getByRole("region", { name: "Compte" });
    await expect.element(menu.getByText("ada@exemple.fr")).toBeVisible();
    await expect.element(menu.getByRole("button", { name: "Se déconnecter" })).toBeVisible();
    expect(accountMenuButton(screen).element().getAttribute("aria-controls")).toBe(
      menu.element().id,
    );
  });

  it("referme le menu par un second clic", async () => {
    const { account } = fakeAccount({ stored: SESSION });
    const { screen } = await renderButton({ account });

    await accountMenuButton(screen).click();
    await accountMenuButton(screen).click();

    await expect.element(accountMenuButton(screen)).toHaveAttribute("aria-expanded", "false");
    await expect.element(screen.getByRole("region", { name: "Compte" })).not.toBeInTheDocument();
  });

  it("referme le menu avec Échap et rend le focus à l'avatar", async () => {
    const { account } = fakeAccount({ stored: SESSION });
    const { screen } = await renderButton({ account });
    await accountMenuButton(screen).click();
    screen.getByRole("button", { name: "Se déconnecter" }).element().focus();

    await userEvent.keyboard("{Escape}");

    await expect.element(screen.getByRole("region", { name: "Compte" })).not.toBeInTheDocument();
    await expect.element(accountMenuButton(screen)).toHaveFocus();
  });

  it("ancre le menu sous l'avatar, aligné sur son bord droit", async () => {
    const { account } = fakeAccount({ stored: SESSION });
    const { screen } = await renderButton({ account });
    await accountMenuButton(screen).click();
    await userEvent.unhover(accountMenuButton(screen));

    const avatar = () => rectOf(accountMenuButton(screen).element());
    const menu = () => rectOf(screen.getByRole("region", { name: "Compte" }).element());

    await expect.poll(() => menu().top - avatar().bottom).toBe(8);
    await expect.poll(() => menu().right - avatar().right).toBe(0);
  });

  it("garde le menu ouvert pour une autre touche qu'Échap", async () => {
    const { account } = fakeAccount({ stored: SESSION });
    const { screen } = await renderButton({ account });
    await accountMenuButton(screen).click();
    screen.getByRole("button", { name: "Se déconnecter" }).element().focus();

    await userEvent.keyboard("a");

    await expect.element(screen.getByRole("region", { name: "Compte" })).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "Se déconnecter" })).toHaveFocus();
  });

  it("referme le menu par un clic en dehors", async () => {
    const { account } = fakeAccount({ stored: SESSION });
    const { screen } = await renderButton({ account });
    await accountMenuButton(screen).click();

    await screen.getByText("Page d'accueil").click();

    await expect.element(screen.getByRole("region", { name: "Compte" })).not.toBeInTheDocument();
  });

  it("garde le menu ouvert pour un clic dedans", async () => {
    const { account } = fakeAccount({ stored: SESSION });
    const { screen } = await renderButton({ account });
    await accountMenuButton(screen).click();

    await screen.getByRole("region", { name: "Compte" }).getByText("ada@exemple.fr").click();

    await expect.element(screen.getByRole("region", { name: "Compte" })).toBeVisible();
  });

  it("se déconnecte : la page reste, Se connecter revient", async () => {
    const { account, state } = fakeAccount({ stored: SESSION });
    const { screen, router } = await renderButton({ account, url: "/catalogue" });
    await accountMenuButton(screen).click();

    await screen.getByRole("button", { name: "Se déconnecter" }).click();

    await expect.element(screen.getByRole("link", { name: "Se connecter" })).toBeVisible();
    expect(state.loggedOut).toBe(1);
    expect(router.state.location.pathname).toBe("/catalogue");
  });

  it("revient à Se connecter quand l'API refuse la session gardée", async () => {
    const { account } = fakeAccount({ stored: SESSION, accepted: false });
    const { screen } = await renderButton({ account });

    await expect.element(screen.getByRole("link", { name: "Se connecter" })).toBeVisible();
  });

  it("montre l'avatar dès la connexion réussie sur la page de compte", async () => {
    const { screen } = await renderButton({ url: "/compte?redirect=%2Fcatalogue" });

    await screen.getByRole("textbox", { name: "E-mail" }).fill("ada@exemple.fr");
    await screen.getByLabelText("Mot de passe", { exact: true }).fill("un-bon-mot-de-passe");
    await screen.getByRole("button", { name: "Se connecter" }).click();

    await expect.element(screen.getByText("Page du catalogue")).toBeVisible();
    await expect.element(accountMenuButton(screen)).toBeVisible();
  });
});
