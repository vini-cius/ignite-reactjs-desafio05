import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  function getReadingTime(): number {
    const regexPattern = /[^\w]/;
    const totalWords = post.data.content.reduce((acc, item) => {
      const totaHeadinglWords = item.heading?.split(regexPattern).length ?? 0;

      const totalBodyWords = item.body.reduce((bodyAcc, bodyItem) => {
        return bodyAcc + bodyItem.text.split(regexPattern).length;
      }, 0);

      return acc + totaHeadinglWords + totalBodyWords;
    }, 0);

    return Math.round(totalWords / 200);
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling.</title>
      </Head>

      {router.isFallback ? (
        <div className={commonStyles.loading}>Carregando...</div>
      ) : (
        <>
          <div className={styles.banner}>
            <img src={post.data.banner.url} alt={post.data.title} />
          </div>

          <div className={commonStyles.container}>
            <div className={styles.post}>
              <h1>{post.data.title}</h1>

              <div className={styles.info}>
                <div>
                  <FiCalendar size={20} />
                  <time>25 mar 2021</time>
                </div>

                <div>
                  <FiUser size={20} />
                  <span>{post.data.author}</span>
                </div>

                <div>
                  <FiClock size={20} />
                  <span>{getReadingTime()} min</span>
                </div>
              </div>

              <div className={styles.content}>
                {post.data.content.map(content => (
                  <div key={content.heading}>
                    <h2>{content.heading}</h2>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: RichText.asHtml(content.body),
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 20,
    }
  );

  return {
    paths: posts.results.map(post => ({
      params: {
        slug: post.uid,
      },
    })),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  return {
    props: { post: response },
  };
};
