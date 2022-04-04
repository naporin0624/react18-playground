/// <reference types="vite/client" />
/// <reference types="react-dom/experimental" />
/// <reference types="react/experimental" />


interface ImportMetaEnv {
  readonly VITE_GITHUB_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}