import type {
  AlternateLink,
  ArticleStructuredDataInput,
  StructuredData,
} from "@type/seo";
import type { CVData, Locale } from "@type/cv";
import { site } from "../../astro.config";

export function getAbsoluteSiteUrl(pathname: string): string {
  return new URL(pathname, site).toString();
}

export function getCvAlternateLinks(): AlternateLink[] {
  return [
    {
      hreflang: "ru",
      href: getAbsoluteSiteUrl("/cv"),
    },
    {
      hreflang: "en",
      href: getAbsoluteSiteUrl("/en/cv"),
    },
    {
      hreflang: "x-default",
      href: getAbsoluteSiteUrl("/cv"),
    },
  ];
}

function getContactValue(
  contacts: CVData["contactInfo"],
  type: CVData["contactInfo"][number]["type"],
): string | undefined {
  return contacts.find((contact) => contact.type === type)?.value;
}

export function buildCvStructuredData(
  data: CVData,
  locale: Locale,
  canonicalUrl: string,
): StructuredData {
  const website = getContactValue(data.contactInfo, "website") ?? site;
  const github = getContactValue(data.contactInfo, "github");
  const telegram = getContactValue(data.contactInfo, "telegram");
  const email = getContactValue(data.contactInfo, "email");
  const location = getContactValue(data.contactInfo, "location");
  const sameAs = [website, github, telegram].filter(
    (value): value is string => Boolean(value),
  );
  const personId = `${canonicalUrl}#person`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "@id": canonicalUrl,
      inLanguage: locale,
      mainEntity: {
        "@id": personId,
      },
      url: canonicalUrl,
      name: data.personalInfo.name,
      description: data.personalInfo.summary ?? data.personalInfo.title,
    },
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": personId,
      name: data.personalInfo.name,
      url: canonicalUrl,
      image: data.personalInfo.photo
        ? getAbsoluteSiteUrl(data.personalInfo.photo)
        : undefined,
      jobTitle: data.personalInfo.title,
      description: data.personalInfo.summary,
      email: email ? `mailto:${email}` : undefined,
      address: location
        ? {
            "@type": "PostalAddress",
            addressLocality: location,
          }
        : undefined,
      sameAs,
      knowsAbout: data.skills.flatMap((category) =>
        category.skills.map((skill) => skill.name),
      ),
      alumniOf: data.education
        .map((item) => item.subtitle)
        .filter((subtitle): subtitle is string => Boolean(subtitle))
        .map((subtitle) => ({
          "@type": "CollegeOrUniversity",
          name: subtitle,
        })),
      worksFor: data.workExperience[0]?.subtitle
        ? {
            "@type": "Organization",
            name: data.workExperience[0].subtitle,
          }
        : undefined,
    },
  ];
}

export function buildArticleStructuredData({
  title,
  description,
  canonicalUrl,
  imageUrl,
  publishedAt,
  locale,
  tags,
}: ArticleStructuredDataInput): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    image: imageUrl,
    datePublished: publishedAt,
    inLanguage: locale,
    keywords: tags,
    articleSection: "Tech",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    author: {
      "@type": "Person",
      name: "dadyarri",
      url: "https://t.me/dadyarri",
    },
    publisher: {
      "@type": "Person",
      name: "dadyarri",
      url: site,
    },
    isPartOf: {
      "@type": "Blog",
      name: "Личный блог dadyarri",
      url: site,
    },
  };
}
