import React from "react";
import Head from "next/head";
import styles from "./layout.module.css";
import utilStyles from "../styles/utils.module.css";
import Link from "next/link";

const name = "Next.js on AWS Lambda";
export const siteTitle = "Next.js on AWS Lambda";
const logoSrc = `${process.env.BASE_PATH}/images/formidable-logo.png`;

export default function Layout({ children, home }) {
  return (
    <div className={styles.container}>
      <Head>
        {/* TODO: Favicon will need separately asset handling to be at root slot. */}
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="A demonstration blog for deploying Next.js on Lambda"
        />
        <meta name="og:title" content={siteTitle} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <header className={styles.header}>
        {home ? (
          <>
            <img
              src={logoSrc}
              className={`${styles.headerHomeImage} ${utilStyles.borderCircle}`}
              alt={name}
            />
            <h1 className={utilStyles.heading2Xl}>{name}</h1>
          </>
        ) : (
          <>
            <Link href="/">
              <a>
                <img
                  src={logoSrc}
                  className={`${styles.headerImage} ${utilStyles.borderCircle}`}
                  alt={name}
                />
              </a>
            </Link>
            <h2 className={utilStyles.headingLg}>
              <Link href="/">
                <a className={utilStyles.colorInherit}>{name}</a>
              </Link>
            </h2>
          </>
        )}
      </header>
      <main>{children}</main>
      {!home && (
        <div className={styles.backToHome}>
          <Link href="/">
            <a>← Back to home</a>
          </Link>
        </div>
      )}
    </div>
  );
}
