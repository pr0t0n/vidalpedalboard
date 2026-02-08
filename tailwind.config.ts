import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        pedal: {
          tuner: "hsl(var(--pedal-tuner))",
          "tuner-glow": "hsl(var(--pedal-tuner-glow))",
          compressor: "hsl(var(--pedal-compressor))",
          "compressor-glow": "hsl(var(--pedal-compressor-glow))",
          drive: "hsl(var(--pedal-drive))",
          "drive-glow": "hsl(var(--pedal-drive-glow))",
          chorus: "hsl(var(--pedal-chorus))",
          "chorus-glow": "hsl(var(--pedal-chorus-glow))",
          tremolo: "hsl(var(--pedal-tremolo))",
          "tremolo-glow": "hsl(var(--pedal-tremolo-glow))",
          delay: "hsl(var(--pedal-delay))",
          "delay-glow": "hsl(var(--pedal-delay-glow))",
          wah: "hsl(var(--pedal-wah))",
          "wah-glow": "hsl(var(--pedal-wah-glow))",
          reverb: "hsl(var(--pedal-reverb))",
          "reverb-glow": "hsl(var(--pedal-reverb-glow))",
        },
        led: {
          on: "hsl(var(--led-on))",
          off: "hsl(var(--led-off))",
          sharp: "hsl(var(--led-tuner-sharp))",
          flat: "hsl(var(--led-tuner-flat))",
        },
        metal: {
          dark: "hsl(var(--metal-dark))",
          mid: "hsl(var(--metal-mid))",
          light: "hsl(var(--metal-light))",
          highlight: "hsl(var(--metal-highlight))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
