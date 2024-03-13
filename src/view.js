const render = (state, elements) => {
  const { urlInput, feedbackMessage, submitButton } = elements;

  urlInput.classList.remove('is-invalid');
  feedbackMessage.classList.remove('text-danger');
  feedbackMessage.classList.remove('text-success');
  feedbackMessage.textContent = '';

  if (!state.isValid) {
    urlInput.classList.add('is-invalid');
    feedbackMessage.classList.add('text-danger');
    feedbackMessage.textContent = state.currentError;
  } else if (state.isValid && state.rssFeeds.length > 0) {
    feedbackMessage.classList.add('text-success');
    feedbackMessage.textContent = 'RSS успешно загружен';
  }
  submitButton.disabled = false;
};

export default render;
