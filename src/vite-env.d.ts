/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_IDEOGRAM_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 