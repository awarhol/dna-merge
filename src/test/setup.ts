import '@testing-library/jest-dom'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common', 'home', 'algorithm'],
  defaultNS: 'common',
  debug: false,
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: {
      common: {},
      home: {},
      algorithm: {},
    },
  },
  react: {
    useSuspense: false,
  },
})
