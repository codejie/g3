import { createI18n } from 'vue-i18n';
import zhCN from './zh-CN.json';
import enUS from './en-US.json';

const savedLocale = localStorage.getItem('locale') || 'zh-CN';

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
});

export default i18n;

export function setLocale(locale: string) {
  (i18n.global.locale as any).value = locale;
  localStorage.setItem('locale', locale);
}

export function getLocale(): string {
  return (i18n.global.locale as any).value as string;
}
