import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#111111", bone: "#f4f1eb", blue: "#07488e", lime: "#baff00" },
      fontFamily: { display: ["Arial Black", "Arial", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
