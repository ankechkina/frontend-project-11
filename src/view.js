const renderFeedback = (state, feedbackElements, i18nInstance) => {
  const { urlInput, feedbackMessage, submitButton } = feedbackElements;

  // console.log('тратата');

  urlInput.classList.remove('is-invalid');
  feedbackMessage.classList.remove('text-danger');
  feedbackMessage.classList.remove('text-success');
  feedbackMessage.textContent = '';

  submitButton.disabled = state.inputForm.state === 'processing';

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
  // console.log('ТУТУТУ');

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

  const postsGroup = document.querySelector('.posts-group');
  const feedsGroup = document.querySelector('.feeds-group');

  feedsGroup.innerHTML = `<li class="list-group-item border-0 border-end-0">
    <h3 class="h6 m-0">${state.currentRss.title}</h3>
    <p class="m-0 small text-black-50">${state.currentRss.description}</p>
</li>`;

  state.currentRss.items.forEach((item) => {
    const listItem = document.createElement('li');
    listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

    const link = document.createElement('a');
    link.setAttribute('href', item.link);
    link.classList.add('fw-bold');
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    link.textContent = item.title;

    const button = document.createElement('button');
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.setAttribute('data-id', '0');
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#modal');
    button.textContent = i18nInstance.t('content.viewButton');

    listItem.appendChild(link);
    listItem.appendChild(button);

    postsGroup.prepend(listItem);
  });
};

export { renderFeedback, renderContent };
