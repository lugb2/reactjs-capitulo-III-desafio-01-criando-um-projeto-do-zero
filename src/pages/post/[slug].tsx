import { GetStaticPaths, GetStaticProps } from 'next';
import Head from "next/head";

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import { RichText } from "prismic-dom";

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Header from '../../components/Header';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useRouter } from 'next/router';

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

export default function Post({ post }: PostProps) {

	// router
	const router = useRouter();

	// função para calcular tempo estimado de leitura
	const calcularTempoLeitura = () => {

		// prepara
		let totalTexto = 0;

		// percorrer conteúdos
		post.data.content.forEach((content) => {
			content.body.forEach((body) => {
				totalTexto += body.text.length
			})
		});

		// calcula tempo em segundos (+/- 18 letras por segundo)
		let totalTempoEstimado = totalTexto / 18;

		// retorna em minutos
		return Math.round(totalTempoEstimado / 60);
		
	}

	// se está no fallback do static
	if(router.isFallback){

		return <div className={commonStyles.loadingMessage}>
			Carregando...
		</div>;
	}

  	return (
		<>
			<Head>
				<title>{post.data.title} | spacetravelling</title>
			</Head>

			<Header />

			<main className={styles.container}>

				<div className={styles.banner}>
					<img src={post.data.banner.url} alt="banner" />
				</div>
				<div className={styles.post}>
					<h1>{post.data.title}</h1>
					<div className={commonStyles.info}>
						<span>
							<FiCalendar />
							<time>
								{format(
									new Date(post.first_publication_date),
									"dd MMM yyyy",
									{
										locale: ptBR,
									}
								)}
							</time>
						</span>
						<span>
							<FiUser />
							<span>{post.data.author}</span>
						</span>
						<span>
							<FiClock />
							<span>{calcularTempoLeitura()} min</span>
						</span>
					</div>

					{
						post.data.content.map((content, i) => (
							<div key={i} className={styles.postContent}>
								<h2>{content.heading}</h2>
								<div
									className={styles.postContentContent}
									dangerouslySetInnerHTML={{
										__html: RichText.asHtml(content.body)
									}}
								/>
							</div>
						))
					}
				</div>
			</main>
		</>
	)
}

export const getStaticPaths = async () => {
	const prismic = getPrismicClient();
	const response = await prismic.query([
		Prismic.predicates.at('document.type', 'posts')
	]);
	
	const paths = response.results.map((post) => ({
		params: {
			slug: post.uid
		}
	}));

	return {

		// passa parametros que devem ser criados como páginas estáticas no build
		paths,

		// true: carregar pelo browser
		// false: se não carregado, erro 404
		// 'blocking': carrega o conteúdo se não existir na camada do next
		fallback: true
	}
};

export const getStaticProps: GetStaticProps = async ({ params }) => {

	// pega o id
	const { slug } = params;

	// consulta
	const prismic = getPrismicClient();
	const response = await prismic.getByUID('posts', String(slug), {});

	// retorna
	return {
		props: {
			post: response
		},
		revalidate: 60 * 30 // 30 minutos
	};
};