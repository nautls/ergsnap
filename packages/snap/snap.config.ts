import { resolve } from "node:path";
import type { SnapConfig } from "@metamask/snaps-cli";

const config: SnapConfig = {
  bundler: "webpack",
  input: resolve(__dirname, "src/index.ts"),
  server: {
    port: 8080
  }
};

export default config;
