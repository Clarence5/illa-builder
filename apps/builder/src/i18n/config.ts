import { formatLanguage } from "@illa-public/utils"
import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"
import deDE from "./locale/de-DE.json"
import enUS from "./locale/en-US.json"
import jaJP from "./locale/ja-JP.json"
import zhCN from "./locale/zh-CN.json"

export const resources = {
  "en-US": {
    translation: enUS,
  },
  "zh-CN": {
    translation: zhCN,
  },
  "ja-JP": {
    translation: jaJP,
  },
  "de-DE": {
    translation: deDE,
  },
} as const

export const languageKeys = Object.keys(resources)

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: (code) => {
      const language = formatLanguage(code)
      return [language, "en-US"]
    },
    debug: false,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources,
    returnNull: false,
    detection: {},
  })

export const LANG_OPTIONS = Object.keys(resources).map((key) => {
  return {
    label: i18n.t(`language.${key}`),
    value: key,
  }
})

export default i18n
