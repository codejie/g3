/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENCODE_URL: string
  readonly VITE_WORKSPACE_ROOT: string
  readonly VITE_HIDE_THINKING: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
