const render = (state, elements, i18nInstance) => {
  const { urlInput, feedbackMessage, submitButton } = elements;

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

export default render;
