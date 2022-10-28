import { createI18n } from 'vue-i18n'
import en from './locales/en.json'

const i18n = createI18n({
  legacy: false,
  locale: navigator.language,
  fallbackLocale: 'en',
  messages: {
    en
  }
})
export default i18n

export async function setLanguage(lang: string, replace = false) {
  try {
    if (i18n.global.availableLocales.includes(lang as any))
    return;
    const msg = await import(`./locales/${lang}.json`);
    i18n.global.setLocaleMessage(lang, msg.default);
    if (replace)
      i18n.global.locale.value = lang as any;
  }
  catch (e) {
    console.warn(`Language '${lang}' not yet supported`);
    document.querySelector('html')?.setAttribute('lang', i18n.global.fallbackLocale.value as string);
  }
}

setLanguage(i18n.global.locale.value);
document.querySelector('html')?.setAttribute('lang', i18n.global.locale.value);