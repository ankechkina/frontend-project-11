const getPostsIds = () => {
	const links = document.querySelectorAll('a[data-id]');
	const idsArray = Array.from(links).map(link => parseInt(link.dataset.id));
	return idsArray;
};

const changePostsUi = (state) => {
	const links = document.querySelectorAll('a[data-id]');
	const visitedUiObj = state.uiState.posts.filter((post) => post.state === 'visited');

	const visitedLinks = visitedUiObj.map((post) => {
		return Array.from(links).find((el) => parseInt(el.dataset.id) === post.postId);
	});

	visitedLinks.forEach((el) => {
		el.classList.remove('fw-bold');
		el.classList.add('fw-normal');
	});

};

// добавить предпросмотр поста в модальном окне

export { getPostsIds, changePostsUi };