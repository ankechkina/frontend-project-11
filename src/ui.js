const changePostsUi = (state) => {
  const links = Array.from(document.querySelectorAll('a[data-id]'));
  const visitedPosts = state.uiState.posts.filter((post) => post.state === 'visited');

  visitedPosts.forEach((post) => {
    const foundLink = links.find((el) => el.dataset.id === post.postId);
    if (foundLink) {
      foundLink.classList.remove('fw-bold');
      foundLink.classList.add('fw-normal', 'link-secondary');
    }
  });
};

export default changePostsUi;
