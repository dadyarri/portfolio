export interface AlternateLink {
  href: string;
  hreflang: string;
}

export type StructuredData = Record<string, unknown> | Array<Record<string, unknown>>;

export interface ArticleStructuredDataInput {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  publishedAt: string;
  locale: string;
  tags: string[];
}
