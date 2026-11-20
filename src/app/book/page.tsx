import { AuthorProfile, BookFeature } from "@/components/publication";
import { SectionHeading, JoinCTA } from "@/components/ui";
import { publication as book } from "@/lib/publication";
import { metadata as meta, siteUrl } from "@/lib/seo";
import styles from "@/components/publication.module.css";

export const metadata = meta(
  `${book.title}｜图书与作者`,
  `${book.author}著，${book.publisher}出版。了解《${book.title}：${book.subtitle}》的内容、出版资料与作者介绍。`,
  "/book",
);

export default function BookPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": `${siteUrl}/book#publication`,
    name: `${book.title}：${book.subtitle}`,
    url: `${siteUrl}/book`,
    isbn: book.isbn,
    datePublished: book.publishedAt,
    inLanguage: "zh-CN",
    image: `${siteUrl}${book.cover}`,
    description: book.description,
    sameAs: book.publisherUrl,
    publisher: { "@type": "Organization", name: book.publisher },
    author: {
      "@type": "Person",
      "@id": `${siteUrl}/about#author`,
      name: book.author,
      url: `${siteUrl}/about#author`,
      image: `${siteUrl}${book.portrait}`,
    },
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <BookFeature detail />
      <section className={`wrap section ${styles.reading}`}>
        <SectionHeading
          eyebrow="READ WITH A REAL QUESTION"
          title="带着你正在解决的问题，开始阅读"
        />
        <div className="grid-3">
          {book.readingDirections.map((direction, index) => (
            <article
              key={direction.title}
              className={`${styles.readingCard} reveal`}
              data-reveal-index={index}
            >
              <span>READING PATH / 0{index + 1}</span>
              <h3>{direction.title}</h3>
              <p>{direction.description}</p>
            </article>
          ))}
        </div>
        <p className={styles.source}>
          出版信息及作者履历依据
          <a href={book.publisherUrl} target="_blank" rel="noopener noreferrer">
            清华大学出版社图书资料
          </a>
          整理，核对日期：2026 年 11 月 20 日。
        </p>
      </section>
      <AuthorProfile />
      <JoinCTA />
    </>
  );
}
