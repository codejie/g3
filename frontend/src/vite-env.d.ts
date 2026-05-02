/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENCODE_URL: string
  readonly VITE_WORKSPACE_ROOT: string
  readonly VITE_HIDE_THINKING: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'element-plus/dist/locale/zh-cn.mjs' {
  import type { Language } from 'element-plus/dist/locale';
  const locale: Language;
  export default locale;
}

declare module 'element-plus/dist/locale/en.mjs' {
  import type { Language } from 'element-plus/dist/locale';
  const locale: Language;
  export default locale;
}
