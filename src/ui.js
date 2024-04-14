const changePostsUi = (state) => {
  const links = Array.from(document.querySelectorAll('a[data-id]'));
  const { visitedIds } = state.uiState;

  visitedIds.forEach((postId) => {
    const foundLink = links.find((el) => el.dataset.id === postId);
    if (foundLink) {
      foundLink.classList.remove('fw-bold');
      foundLink.classList.add('fw-normal', 'link-secondary');
    }
  });
};

export default changePostsUi;
