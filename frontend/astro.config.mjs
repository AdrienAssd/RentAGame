// @ts-check
import { defineConfig } from 'astro/config';
import vercel from "@astrojs/vercel/serverless";

export default {
  output: "server", // important !
  adapter: vercel({}),
};


// https://astro.build/config
