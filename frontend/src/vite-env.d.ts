/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENCODE_URL: string
  readonly VITE_WORKSPACE_ROOT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
