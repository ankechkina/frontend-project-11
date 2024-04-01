const getPostsIds = () => {
  const links = document.querySelectorAll('a[data-id]');
  const idsArray = Array.from(links).map((link) => parseInt(link.dataset.id, 10));
  return idsArray;
};

const changePostsUi = (state) => {
  const links = Array.from(document.querySelectorAll('a[data-id]'));
  const visitedObj = state.uiState.posts.filter((post) => post.state === 'visited');

  const visitedLinks = visitedObj.map((post) => {
    const foundLink = links.find((el) => parseInt(el.dataset.id, 10) === post.postId);
    return foundLink;
  });

  visitedLinks.forEach((el) => {
    el.classList.remove('fw-bold');
    el.classList.add('fw-normal');
  });
};

export { getPostsIds, changePostsUi };
