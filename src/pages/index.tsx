import { GetStaticProps } from 'next';
import { useRouter } from 'next/router'

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';

import { FiCalendar, FiUser } from 'react-icons/fi';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';
import { useState } from 'react';
import { useEffect } from 'react';

interface Post {
	uid?: string;
	first_publication_date: string | null;
	data: {
		title: string;
		subtitle: string;
		author: string;
	};
}

interface PostPagination {
	next_page: string;
	results: Post[];
}

interface HomeProps {
  	postsPagination: PostPagination;
}

// função para formatar resultados
const formatResults = (results) => {

	// formata resultados
	const formattedResults = results.map((post) => {
        return {
            uid: post.uid,
			first_publication_date: format(
				new Date(post.first_publication_date),
				"dd MMM yyyy",
				{
					locale: ptBR,
				}
			),
			data: {
				title: post.data.title,
				subtitle: post.data.subtitle,
				author: post.data.author
			}
        }
    })

	return formattedResults;
}

export default function Home({ postsPagination }: HomeProps) {

	// router
	const router = useRouter();

	// estados
	const [ loading, setLoading ] = useState(false);
	const [ posts, setPosts ] = useState<Post[]>([]);
	const [ nextPage, setNextPage ] = useState<string>(null);

	useEffect(() => {

		// define valores iniciais
		setPosts(formatResults(postsPagination.results));
		setNextPage(postsPagination.next_page);

	}, [])

	const handleLoadPosts = () => {

		// se não possui próximo, retorna
		if(!nextPage){
			return;
		}

		// cria o carregamento
		setLoading(true);

        // faz a consulta dos repositórios
        fetch(nextPage)
        .then(response => response.json())
        .then(data => {

			// remove o carregamento
			setLoading(false);

			// formata os resultados
			const results = formatResults(data.results);

			// define
			setPosts([...posts, ...results]);
			setNextPage(data.next_page);

        });

	}

	return (
		<>
            <main className={styles.container}>
				<Header />

				<div className={styles.content}>
					<div className={styles.posts}>
						{
							posts.map((post) => (
								<div
									key={post.uid}
									className={styles.post}
									onClick={() => {
										router.push(`/post/${post.uid}`, {}, {});
									}}
								>
									<h1>{post.data.title}</h1>
									<p>{post.data.subtitle}</p>
									<div className={commonStyles.info}>
										<span>
											<FiCalendar />
											<time>
												{post.first_publication_date}
											</time>
										</span>
										<span>
											<FiUser />
											<span>{post.data.author}</span>
										</span>
									</div>
								</div>
							))
						}
					</div>
					{
						nextPage && <button
							className={styles.buttonNextPage}
							onClick={handleLoadPosts}
						>
							Carregar mais posts
						</button>
					}
				</div>
            </main>
        </>
	)
}

export const getStaticProps: GetStaticProps = async () => {

	const prismic = getPrismicClient();

	// consulta no prismic
	const postsResponse = await prismic.query([
		Prismic.predicates.at('document.type', 'posts')
	], {
		pageSize: 20,
	});

    return {
        props: {
            postsPagination: {
				next_page: postsResponse.next_page,
				results: postsResponse.results
			}
        }
    }
};
