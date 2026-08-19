import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// OpenNext config for Cloudflare Workers/Pages.
// We don't use ISR/on-demand revalidation, so no cache overrides are needed, // the default (no persistent cache) is fine for this app.
const config = defineCloudflareConfig();

// `opennextjs-cloudflare build` shells out to build the underlying Next.js
// app, defaulting to `npm run build`, but that script IS this command,
// which would recurse into itself forever. Point it at the plain Next build.
config.buildCommand = "npm run build:next";

export default config;
