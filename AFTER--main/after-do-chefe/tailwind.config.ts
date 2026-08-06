import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./config/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta oficial RR LOUNGE. Nenhum hex solto no resto do código —
        // os mesmos valores estão espelhados como CSS variables em globals.css.
        fundo: "#0A0A0A",
        grafite: "#181613",
        dourado: {
          DEFAULT: "#C9A24B",
          claro: "#E7C873",
        },
        creme: "#F7E7B0",
        texto: {
          DEFAULT: "#EDE6DA",
          secundario: "#9A9086",
        },
        borda: "rgba(201,162,75,0.22)",
      },
      fontFamily: {
        // Cinzel: títulos e a marca. Playfair: tagline e textos de apoio.
        // O corpo/UI usa a stack do sistema — legível em formulário e sem
        // custo de download extra.
        title: ["var(--font-cinzel)", "Georgia", "serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        body: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "sans-serif"],
      },
      letterSpacing: {
        marca: "0.22em",
      },
      backgroundImage: {
        "ouro-linear": "linear-gradient(135deg,#C9A24B 0%,#E7C873 45%,#C9A24B 100%)",
      },
      keyframes: {
        surgir: {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        brilho: {
          "0%,100%": { opacity: "0.35" },
          "50%": { opacity: "0.75" },
        },
        pulsoSuave: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
      animation: {
        surgir: "surgir .7s cubic-bezier(.16,1,.3,1) both",
        brilho: "brilho 6s ease-in-out infinite",
        pulsoSuave: "pulsoSuave 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
