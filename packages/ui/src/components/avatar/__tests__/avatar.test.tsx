import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { Avatar } from "../avatar.tsx";

describe("Avatar", () => {
  it("montre une initiale, décorative : le nom vient de son contexte", async () => {
    const screen = await render(<Avatar initial="A" />);

    await expect.element(screen.getByText("A")).toBeVisible();
    expect(screen.container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
  });

  it("cercle de 44px par défaut, initiale centrée en Title 3", async () => {
    const screen = await render(<Avatar initial="A" />);

    await expect.element(screen.getByText("A")).toHaveStyle({
      width: "44px",
      height: "44px",
      borderTopLeftRadius: "50%",
      fontSize: "19px",
      display: "grid",
    });
  });

  it("en grand : 52px", async () => {
    const screen = await render(<Avatar initial="A" size="medium" />);

    await expect.element(screen.getByText("A")).toHaveStyle({ width: "52px", height: "52px" });
  });
});
