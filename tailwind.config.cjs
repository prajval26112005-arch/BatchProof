// tailwind.config.cjs
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "bg": "#F7F4EE",
        "ink": "#17251F",
        "brand": "#1E6B52",
        "amber": "#E7A928",
        "recall": "#B84A3A",
        "coral": "#D96C4A"
      },
      fontFamily: {
        heading: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"]
      }
    }
  },
  plugins: []
};
