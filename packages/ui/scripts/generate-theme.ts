import { writeFile } from "node:fs/promises";

import { themeStylesheet } from "../src/theme/theme-stylesheet.ts";
import { tokens } from "../src/tokens/index.ts";

const destination = new URL("../src/theme/theme.css", import.meta.url);

await writeFile(destination, themeStylesheet(tokens));
