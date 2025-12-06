import theme from "./config/theme";

const font_base = Number(theme.fonts.font_size.base.replace("px", ""));
const font_scale = Number(theme.fonts.font_size.scale);
const h6 = font_base / font_base;
const h5 = h6 * font_scale;
const h4 = h5 * font_scale;
const h3 = h4 * font_scale;
const h2 = h3 * font_scale;
const h1 = h2 * font_scale;
let fontPrimary, fontPrimaryType, fontSecondary, fontSecondaryType;
if (theme.fonts.font_family.primary) {
  fontPrimary = theme.fonts.font_family.primary
    .replace(/\+/g, " ")
    .replace(/:[ital,]*[ital@]*[wght@]*[0-9,;]+/gi, "");
  fontPrimaryType = theme.fonts.font_family.primary_type;
}
if (theme.fonts.font_family.secondary) {
  fontSecondary = theme.fonts.font_family.secondary
    .replace(/\+/g, " ")
    .replace(/:[ital,]*[ital@]*[wght@]*[0-9,;]+/gi, "");
  fontSecondaryType = theme.fonts.font_family.secondary_type;
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.tsx",
    'node_modules/daisyui/dist/**/*.js',
    'node_modules/react-daisyui/dist/**/*.js',
    "node_modules/flowbite-react/**/*.js",
  ],
  darkMode: "class",
  theme: {
    screens: {
      sm: "540px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    container: {
      center: true,
      padding: "2rem",
    },
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', maxHeight: '0' },
          '100%': { opacity: '1', maxHeight: '200px' }, // Adjust maxHeight as per your requirement
        },
        fadeOut: {
          '0%': { opacity: '1', maxHeight: '200px' }, // Adjust maxHeight as per your requirement
          '100%': { opacity: '0', maxHeight: '0' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideOutRight: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        slideInTop: {
          '0%': { transform: 'translateY(-20vh)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideOutTop: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-20vh)', opacity: '0' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 300ms ease-in-out forwards',
        fadeOut: 'fadeOut 300ms ease-in-out forwards',
        slideInRight: 'slideInRight 300ms ease-in-out forwards',
        slideOutRight: 'slideOutRight 300ms ease-in-out forwards',
        slideInTop: 'slideInTop 300ms ease-in-out forwards',
        slideOutTop: 'slideOutTop 300ms ease-in-out forwards',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        big: '9px 10px 10px -7px rgba(202, 197, 197, 1)',
        innerBig: '0 0 0 5px #000',
        "darkmode-big": '9px 10px 10px -7px rgba(0, 0, 0, 1)',
        "small": "0px 1px 10px -3px rgba(66, 68, 90, 0.21)",
        "darkmode-small": "0px 1px 10px -3px rgba(0, 0, 0, 1)",
        modal: theme.colors.default.modal.shadow,
        "darkmode-modal": theme.colors.darkmode.modal.shadow,
        drawer: '9px 10px 10px -7px rgb(202 197 197 / 48%)',
        "darkmode-drawer": '9px 10px 10px -7px rgb(0 0 0 / 20%)',
      },
      colors: {
        text: theme.colors.default.text_color.default,
        light: theme.colors.default.text_color.light,
        dark: theme.colors.default.text_color.dark,
        primary: theme.colors.default.theme_color.primary,
        secondary: theme.colors.default.theme_color.secondary,
        "secondary-accent": theme.colors.default.theme_color["secondary-accent"],
        body: theme.colors.default.theme_color.body,
        border: theme.colors.default.theme_color.border,
        input: theme.colors.default.input.bg,
        "input-border": theme.colors.default.input.border,
        "theme-light": theme.colors.default.theme_color.theme_light,
        'navigation-bg': theme.colors.default.navigation.bg,
        "form": theme.colors.default.theme_color.form,
        "checkbox-border": theme.colors.default.checkbox.border,
        "checkbox-checked": theme.colors.darkmode.theme_color.secondary,
        alarm: theme.colors.default.text_color.alarm,
        success: theme.colors.default.text_color.success,
        info: theme.colors.default.text_color.info,
        warning: theme.colors.default.text_color.warning,
        "modal-background": theme.colors.default.modal.background,
        "modal-separator": theme.colors.default.modal.separator,
        "drawer-background": theme.colors.default.drawer.background,
        "drawer-icon": theme.colors.default.drawer.icon,
        "drawer-icon-selected": theme.colors.default.drawer['icon-selected'],
        darkmode: {
          text: theme.colors.darkmode.text_color.default,
          light: theme.colors.darkmode.text_color.light,
          dark: theme.colors.darkmode.text_color.dark,
          primary: theme.colors.darkmode.theme_color.primary,
          secondary: theme.colors.darkmode.theme_color.secondary,
          "secondary-accent": theme.colors.darkmode.theme_color["secondary-accent"],
          body: theme.colors.darkmode.theme_color.body,
          border: theme.colors.darkmode.theme_color.border,
          input: theme.colors.darkmode.input.bg,
          "input-border": theme.colors.darkmode.input.border,
          "theme-light": theme.colors.darkmode.theme_color.theme_light,
          'navigation-bg': theme.colors.darkmode.navigation.bg,
          "form": theme.colors.darkmode.theme_color.form,
          "checkbox-border": theme.colors.darkmode.checkbox.border,
          "checkbox-checked": theme.colors.darkmode.theme_color.secondary,
          alarm: theme.colors.darkmode.text_color.alarm,
          success: theme.colors.darkmode.text_color.success,
          info: theme.colors.darkmode.text_color.info,
          warning: theme.colors.darkmode.text_color.warning,
          "modal-background": theme.colors.darkmode.modal.background,
          "modal-separator": theme.colors.darkmode.modal.separator,
          "drawer-background": theme.colors.darkmode.drawer.background,
          "drawer-icon": theme.colors.darkmode.drawer.icon,
          "drawer-icon-selected": theme.colors.darkmode.drawer['icon-selected'],
          "table-darker": theme.colors.darkmode.table.darker,
          "table-lighter": theme.colors.darkmode.table.lighter,
        },
      },
      fontSize: {
        base: font_base + "px",
        h1: h1 + "rem",
        "h1-sm": h1 * 0.8 + "rem",
        h2: h2 + "rem",
        "h2-sm": h2 * 0.8 + "rem",
        h3: h3 + "rem",
        "h3-sm": h3 * 0.8 + "rem",
        h4: h4 + "rem",
        h5: h5 + "rem",
        h6: h6 + "rem",
      },
      fontFamily: {
        primary: [fontPrimary, fontPrimaryType],
        secondary: [fontSecondary, fontSecondaryType],
        'arial': ['Arial', 'sans-serif'],
        'firaCode': ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [
    // require('flowbite/plugin'),
    // require("daisyui"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
  ],
};