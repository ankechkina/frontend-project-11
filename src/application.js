/* eslint-disable no-console, no-unused-vars, prefer-destructuring, import/extensions */

import './styles.scss';
import 'bootstrap';
import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';
import i18n from 'i18next';
import ru from './locales/ru.js';
import { renderFeedback, renderContent } from './view.js';
import parseRss from './parser.js';

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
      currentRss: {
        state: 'empty', // empty processing updated
        title: '',
        description: '',
        items: [],
      },
      rssFeeds: [],
    };

    const getPath = (url) => `https://allorigins.hexlet.app/get?url=${encodeURIComponent(url)}`;

    /* yup.setLocale({
       mixed: {
         default: 'Ошибка при проверке URL',
       },
     }); */

    const validUrlSchema = yup.string().url();

    const isValidRss = (site) => site.includes('<rss') || site.includes('<channel');

    const feedbackElements = {
      urlInput: document.querySelector('#url-input'),
      feedbackMessage: document.querySelector('.feedback'),
      submitButton: document.querySelector('button[type="submit"]'),
    };

    const contentElements = {
      postsDiv: document.querySelector('.posts'),
      feedsDiv: document.querySelector('.feeds'),
    };

    const watchedInputForm = onChange(state.inputForm, () => {
      renderFeedback(state, feedbackElements, i18nInstance);
    });
    const watchedCurrentRss = onChange(state.currentRss, () => {
      renderContent(state, contentElements, i18nInstance);
    });

    const form = document.querySelector('form');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const inputValue = formData.get('url');
      const normalizedInput = inputValue.toLowerCase().trim();
      state.inputForm.currentInput = normalizedInput;
      form.reset();

      watchedInputForm.state = 'processing';
      state.currentRss.state = 'processing';

      validUrlSchema.isValid(state.inputForm.currentInput)
        .then((isValid) => {
          if (!isValid) {
            state.inputForm.currentError = 'invalidUrl';
            watchedInputForm.state = 'failed';
            state.currentRss.state = 'empty';
          }
          if (isValid) {
            const path = getPath(state.inputForm.currentInput);

            axios.get(path)
              .then((response) => {
                if (response.status === 200) return response.data;
                throw new Error('Bad response');
              })
              .then((data) => {
                const pageContent = data.contents;
                const validRssFeed = isValidRss(pageContent);

                if (!validRssFeed) {
                  state.inputForm.currentError = 'invalidRss';
                  watchedInputForm.state = 'failed';
                  state.currentRss.state = 'empty';
                } else if (validRssFeed && state.rssFeeds.includes(state.inputForm.currentInput)) {
                  state.inputForm.currentError = 'existingRss';
                  watchedInputForm.state = 'failed';
                  state.currentRss.state = 'empty';
                } else if (validRssFeed && !state.rssFeeds.includes(state.inputForm.currentInput)) {
                  state.inputForm.currentError = '';
                  state.rssFeeds.push(state.inputForm.currentInput);
                  watchedInputForm.state = 'processed';

                  const channelData = parseRss(pageContent);

                  /*  const updatedCurrentRss = {
                      title: channelData.channelTitle,
                      description: channelData.channelDescription,
                      items: channelData.itemData,
                    }; */

                  // Object.assign(watchedCurrentRss, updatedCurrentRss);

                  state.currentRss.title = channelData.channelTitle;
                  state.currentRss.description = channelData.channelDescription;
                  state.currentRss.items = channelData.itemData;

                  console.log(state);

                  watchedCurrentRss.state = 'updated';
                }
              })
              .catch((error) => {
                console.log(error.message);
                state.inputForm.currentError = 'urlError';
                watchedInputForm.state = 'failed';
              });
          }
        })
        .catch(() => {
          state.inputForm.currentError = 'urlError';
          watchedInputForm.state = 'failed';
        });
    });
  });
};
