import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";

import { MovieThumb, type MovieThumbProps } from "../movie-thumb.tsx";

const POSTER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='9'/>";

const renderMovieThumb = (overrides: Partial<MovieThumbProps> = {}) =>
  render(<MovieThumb title="Le Grand Voyage" {...overrides} />);

describe("MovieThumb", () => {
  it("montre l'image du film, décrite par son titre", async () => {
    const screen = await renderMovieThumb({ image: POSTER });

    await expect
      .element(screen.getByRole("img", { name: "Le Grand Voyage" }))
      .toHaveAttribute("src", POSTER);
  });

  it("sans image, affiche le titre à la place", async () => {
    const screen = await renderMovieThumb();

    await expect.element(screen.getByText("Le Grand Voyage")).toBeVisible();
    expect(screen.container.querySelector("img")).toBeNull();
  });

  it("en paysage par défaut : 224 × 125, coins arrondis de 12", async () => {
    const screen = await renderMovieThumb();

    await expect
      .element(screen.getByTestId("movie-thumb"))
      .toHaveStyle({ width: "224px", height: "125px", borderRadius: "12px" });
  });

  it("en portrait : 224 × 336", async () => {
    const screen = await renderMovieThumb({ orientation: "portrait" });

    await expect
      .element(screen.getByTestId("movie-thumb"))
      .toHaveStyle({ width: "224px", height: "336px" });
  });

  it("l'image couvre toute la vignette", async () => {
    const screen = await renderMovieThumb({ image: POSTER });

    await expect
      .element(screen.getByRole("img"))
      .toHaveStyle({ width: "224px", height: "125px", objectFit: "cover" });
  });

  it("au survol, s'agrandit et flotte au-dessus des autres", async () => {
    const screen = await renderMovieThumb();
    const thumb = screen.getByTestId("movie-thumb");

    await expect.element(thumb).toHaveStyle({ scale: "none", boxShadow: "none" });
    await userEvent.hover(thumb);
    await expect.element(thumb).toHaveStyle({
      scale: "1.18",
      boxShadow: "rgba(0, 0, 0, 0.6) 0px 16px 52px 0px",
    });
  });
});
