const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
    purge: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
    theme: {
        extend: {
            colors: {
                background: "#f3f6fd",
            },
        },
        fontFamily: {
            sans: ['"Inter"', ...fontFamily.sans],
        },
    },
    variants: {
        extend: {},
    },
    plugins: [],
};
