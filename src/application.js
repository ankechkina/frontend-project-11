/* eslint-disable no-console, no-unused-vars, prefer-destructuring, import/extensions */

import './styles.scss';
import 'bootstrap';
import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';
import i18n from 'i18next';
import ru from './locales/ru.js';
import render from './view.js';

export default () => {
  const i18nInstance = i18n.createInstance();
  return i18nInstance.init({
    lng: 'ru',
    debug: true,
    resources: {
      ru,
    },
  }).then(() => {
    const state = {
      inputForm: {
        state: 'filling',
        currentInput: '',
        currentError: '',
      },
      rssFeeds: [],
    };

    const getPath = (url) => `https://allorigins.hexlet.app/get?url=${encodeURIComponent(url)}`;
    const validUrlSchema = yup.string().url('Неправильный формат URL');

    const isValidRss = (site) => site.includes('<rss') || site.includes('<channel');

    const elements = {
      urlInput: document.querySelector('#url-input'),
      feedbackMessage: document.querySelector('.feedback'),
      submitButton: document.querySelector('button[type="submit"]'),
    };

    const watchedState = onChange(state, () => render(state, elements, i18nInstance));

    const form = document.querySelector('form');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      watchedState.inputForm.state = 'processing';

      const formData = new FormData(e.target);
      const inputValue = formData.get('url');
      const normalizedInput = inputValue.toLowerCase().trim();

      state.inputForm.currentInput = normalizedInput;
      form.reset();

      validUrlSchema.isValid(state.inputForm.currentInput)
        .then((isValid) => {
          if (!isValid) {
            state.inputForm.currentError = 'invalidUrl';
            watchedState.inputForm.state = 'failed';
          }
          if (isValid) {
            const path = getPath(state.inputForm.currentInput);

            fetch(path)
              .then((response) => {
                if (response.ok) return response.json();
                watchedState.inputForm.currentError = 'badResponse';
                watchedState.inputForm.state = 'failed';
                return Promise.reject();
              })
              .then((data) => {
                const pageContent = data.contents;
                const validRssFeed = isValidRss(pageContent);

                if (!validRssFeed) {
                  state.inputForm.currentError = 'invalidRss';
                  watchedState.inputForm.state = 'failed';
                } else if (validRssFeed && !state.rssFeeds.includes(state.inputForm.currentInput)) {
                  state.inputForm.currentError = '';
                  watchedState.rssFeeds.push(state.inputForm.currentInput);
                  watchedState.inputForm.state = 'processed';
                } else if (validRssFeed && state.rssFeeds.includes(state.inputForm.currentInput)) {
                  state.inputForm.currentError = 'existingRss';
                  watchedState.inputForm.state = 'failed';
                }
              });
          }
        })
        .catch(() => {
          state.inputForm.currentError = 'urlError';
          watchedState.inputForm.state = 'failed';
        });
    });
  });
};
