import astro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      ".astro/**",
      "dist/**",
      "OgImages/**",
      "public/content/**",
      "public/fonts/**",
    ],
  },
  ...tseslint.configs.recommended,
  ...astro.configs["flat/recommended"],
  {
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
  },
  {
    files: ["public/js/**/*.js"],
    languageOptions: {
      globals: {
        document: "readonly",
        navigator: "readonly",
        window: "readonly",
      },
    },
  },
  {
    files: ["src/integrations/static-code-images.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "prefer-const": "off",
    },
  },
];
