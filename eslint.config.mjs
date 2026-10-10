import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Images are served as-is from the static export; next/image optimisation is off.
      "@next/next/no-img-element": "off",
    },
  },
  { ignores: [".next/**", "out/**", "public/**", "next-env.d.ts"] },
];

export default config;
