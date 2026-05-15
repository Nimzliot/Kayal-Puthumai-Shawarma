import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#060606",
        foreground: "#f8e7a5",
        card: "#111111",
        muted: "#b8a36c",
        border: "rgba(249, 208, 87, 0.2)",
        brand: {
          DEFAULT: "#f7c942",
          soft: "#e5b93d",
          glow: "#ffdf6b",
          deep: "#8f6500"
        },
        success: "#3ddc84",
        danger: "#ff6b6b"
      },
      backgroundImage: {
        hero:
          "radial-gradient(circle at top, rgba(247, 201, 66, 0.18), transparent 30%), linear-gradient(135deg, rgba(247, 201, 66, 0.12), rgba(15, 15, 15, 0.96))",
        card:
          "linear-gradient(180deg, rgba(255, 223, 107, 0.08), rgba(255, 223, 107, 0.03))"
      },
      boxShadow: {
        glow: "0 0 40px rgba(247, 201, 66, 0.22)",
        soft: "0 12px 40px rgba(0, 0, 0, 0.35)"
      },
      fontFamily: {
        display: ["var(--font-cinzel)", "serif"],
        body: ["var(--font-manrope)", "sans-serif"]
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        pulseGlow: "pulseGlow 2.6s ease-in-out infinite",
        slowSpin: "slowSpin 12s linear infinite"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.8", boxShadow: "0 0 18px rgba(247, 201, 66, 0.18)" },
          "50%": { opacity: "1", boxShadow: "0 0 28px rgba(247, 201, 66, 0.35)" }
        },
        slowSpin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
