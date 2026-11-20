import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { publication as book } from "@/lib/publication";
import styles from "./publication.module.css";

export function BookFeature({ detail = false }: { detail?: boolean }) {
  const Heading = detail ? "h1" : "h2";
  return (
    <section
      className={`section wrap ${styles.section}`}
      id="book"
      aria-labelledby="book-title"
    >
      <div className={`${styles.feature} reveal`}>
        <figure className={styles.bookStage}>
          <span className={styles.stageLabel} aria-hidden="true">
            FDE / THE FIELD GUIDE
          </span>
          <div className={styles.cover}>
            <Image
              src={book.cover}
              alt={`《${book.title}：${book.subtitle}》封面，${book.author}著`}
              width={1102}
              height={1404}
              sizes="(max-width: 600px) 220px, (max-width: 900px) 270px, 310px"
              loading={detail ? "eager" : "lazy"}
            />
          </div>
          <figcaption>
            {book.publisher} · {book.publicationLabel}出版
          </figcaption>
        </figure>
        <div className={styles.copy}>
          <span className="eyebrow">
            {detail
              ? "FDE CLUB / PUBLICATION"
              : "05 / FROM THE PAGE TO THE FIELD"}
          </span>
          <Heading id="book-title" className={styles.title}>
            {book.title}
          </Heading>
          <p className={styles.subtitle}>{book.subtitle}</p>
          <p className={styles.description}>{book.description}</p>
          <ul className={styles.topics} aria-label="图书主题">
            {book.topics.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
          <dl className={styles.facts}>
            <div>
              <dt>作者</dt>
              <dd>{book.author} 著</dd>
            </div>
            <div>
              <dt>出版社</dt>
              <dd>{book.publisher}</dd>
            </div>
            <div>
              <dt>出版时间</dt>
              <dd>
                <time dateTime={book.publishedAt}>{book.publicationLabel}</time>
              </dd>
            </div>
            <div>
              <dt>ISBN</dt>
              <dd>{book.isbn}</dd>
            </div>
          </dl>
          <div className={styles.actions}>
            {detail ? (
              <a
                className="button"
                href={book.publisherUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                查看出版社图书资料 <ArrowUpRight size={17} />
              </a>
            ) : (
              <Link className="button" href="/book">
                了解这本书 <BookOpen size={17} />
              </Link>
            )}
            <Link
              className="text-link"
              href={detail ? "#author" : "/about#author"}
            >
              认识作者 <ArrowUpRight size={17} />
            </Link>
          </div>
          <Link href="/about#author" className={styles.authorStrip}>
            <Image
              src={book.portrait}
              alt="邴越肖像"
              width={48}
              height={64}
              sizes="48px"
            />
            <span>
              <strong>{book.author}</strong>
              <small>{book.authorRole}</small>
            </span>
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function AuthorProfile() {
  return (
    <section
      className={`section wrap ${styles.authorSection}`}
      id="author"
      aria-labelledby="author-title"
    >
      <div className={`${styles.authorProfile} reveal`}>
        <div className={styles.portrait}>
          <Image
            src={book.portrait}
            alt="《FDE前线部署工程师》作者邴越"
            width={390}
            height={520}
            sizes="(max-width: 600px) 180px, 230px"
          />
          <span>THE AUTHOR / 邴越</span>
        </div>
        <div className={styles.authorCopy}>
          <span className="eyebrow">ABOUT THE AUTHOR</span>
          <h2 id="author-title">
            邴越<span>《{book.title}》作者</span>
          </h2>
          <p className={styles.authorRole}>{book.authorRole}</p>
          <p>{book.authorBio}</p>
          <p>{book.authorFocus}</p>
          <div className={styles.actions}>
            <Link href="/partners#apply" className="text-link">
              读书会与分享合作 <ArrowUpRight size={17} />
            </Link>
            <a
              href={book.publisherUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link"
            >
              出版社作者介绍 <ArrowUpRight size={17} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
