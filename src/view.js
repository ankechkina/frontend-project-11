const renderFeedback = (state, feedbackElements, i18nInstance) => {
  const { urlInput, feedbackMessage, submitButton } = feedbackElements;

  urlInput.classList.remove('is-invalid');
  feedbackMessage.classList.remove('text-danger');
  feedbackMessage.classList.remove('text-success');
  feedbackMessage.textContent = '';

  submitButton.disabled = state.inputForm.state === 'processing';
  urlInput.disabled = state.inputForm.state === 'processing';

  if (state.inputForm.state === 'failed') {
    urlInput.classList.add('is-invalid');
    feedbackMessage.classList.add('text-danger');

    const errorCode = state.inputForm.currentError;
    feedbackMessage.textContent = i18nInstance.t(`feedback.${errorCode}`);
  }

  if (state.inputForm.state === 'processed') {
    feedbackMessage.classList.add('text-success');
    feedbackMessage.textContent = i18nInstance.t('feedback.success');
  }
};

const renderContent = (state, contentElements, i18nInstance) => {
  const { postsDiv, feedsDiv } = contentElements;

  if (postsDiv.childNodes.length === 0 && feedsDiv.childNodes.length === 0) {
    postsDiv.innerHTML = `<div class="card border-0">
    <div class="card-body">
        <h2 class="card-title h4">${i18nInstance.t('content.postsHeader')}</h2>
    </div>
    <ul class="list-group border-0 rounded-0 posts-group"></ul>
</div>`;

    feedsDiv.innerHTML = `<div class="card border-0">
    <div class="card-body">
        <h2 class="card-title h4">${i18nInstance.t('content.feedsHeader')}</h2>
    </div>
    <ul class="list-group border-0 rounded-0 feeds-group"></ul>
</div>`;
  }

  const postsGroup = document.querySelector('.posts-group');
  const feedsGroup = document.querySelector('.feeds-group');

  postsGroup.innerHTML = '';
  feedsGroup.innerHTML = '';

  let postId = 0;

  state.parsedRss.feeds.forEach((feedObj) => {
    const feedItem = document.createElement('li');
    feedItem.classList.add('list-group-item', 'border-0', 'border-end-0');
    feedsGroup.prepend(feedItem);

    const feedDescription = document.createElement('p');
    feedDescription.classList.add('m-0', 'small', 'text-black-50');
    feedDescription.textContent = feedObj.description;
    feedItem.prepend(feedDescription);

    const feedName = document.createElement('h3');
    feedName.classList.add('h6', 'm-0');
    feedName.textContent = feedObj.title;
    feedItem.prepend(feedName);


    feedObj.itemData.forEach((item) => {
      const listItem = document.createElement('li');
      listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

      postId += 1;

      const link = document.createElement('a');
      link.setAttribute('href', item.link);
      link.setAttribute('data-id', postId);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      link.textContent = item.title;

      if (state.uiState.visitedIds.includes(postId)) {
        link.classList.add('fw-normal');
      } else {
        link.classList.add('fw-bold');
      }

      const button = document.createElement('button');
      button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      button.setAttribute('data-id', postId);
      button.setAttribute('data-bs-toggle', 'modal');
      button.setAttribute('data-bs-target', '#modal');
      button.textContent = i18nInstance.t('content.viewButton');

      listItem.appendChild(link);
      listItem.appendChild(button);

      postsGroup.prepend(listItem);
    });
  });
};

export { renderFeedback, renderContent };