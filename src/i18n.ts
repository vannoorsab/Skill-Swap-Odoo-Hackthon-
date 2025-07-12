import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        home: "Home",
        requests: "Requests",
        saved: "Saved",
        leaderboard: "Leaderboard",
        logout: "Logout",
        login: "Login",
        // ...add more keys as needed
      }
    },
    hi: {
      translation: {
        home: "होम",
        requests: "अनुरोध",
        saved: "सहेजा गया",
        leaderboard: "लीडरबोर्ड",
        logout: "लॉगआउट",
        login: "लॉगिन",
      }
    },
    ta: {
      translation: {
        home: "முகப்பு",
        requests: "கோரிக்கைகள்",
        saved: "சேமிக்கப்பட்டவை",
        leaderboard: "சாதனைப் பட்டியல்",
        logout: "வெளியேறு",
        login: "உள்நுழை",
      }
    }
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n;