import { defineStore } from 'pinia';

const THEME_KEY = 'smartnote_theme';
const SIZE_KEY = 'smartnote_ui_size';

export const usePreferencesStore = defineStore('preferences', {
  state: () => ({
    isDark: false,
    uiSize: 'default'
  }),
  actions: {
    init() {
      const storedTheme = localStorage.getItem(THEME_KEY);
      const storedSize = localStorage.getItem(SIZE_KEY);
      if (storedTheme) {
        this.isDark = storedTheme === 'dark';
        this.applyTheme();
      }
      if (storedSize) {
        this.uiSize = storedSize;
      }
    },
    setDark(value) {
      this.isDark = value;
      localStorage.setItem(THEME_KEY, value ? 'dark' : 'light');
    },
    setSize(value) {
      this.uiSize = value;
      localStorage.setItem(SIZE_KEY, value);
    },
    applyTheme() {
      document.documentElement.classList.toggle('dark', this.isDark);
    }
  }
});
