interface ImportMetaEnv {
  readonly PUBLIC_BOOKING_URL?: string;
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_ALLOW_INDEXING?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
