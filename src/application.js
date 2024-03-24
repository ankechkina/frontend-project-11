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
import getUpdates from './updates.js';
import { getPath } from './utils.js';

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
        state: 'filling', // filling, processing, processed, failed
        currentInput: '',
        currentError: '',
      },
      currentRss: {
        state: 'empty', // empty, processing, loaded
        title: '',
        description: '',
        items: [],
      },
      parsedRss: {
        state: 'empty', // empty, loaded, checking updates, updated, no updates
        feeds: [],
      },
      rssPaths: [],
    };

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

    const watchedFeeds = onChange(state.parsedRss, () => {
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
                } else if (validRssFeed && state.rssPaths.includes(state.inputForm.currentInput)) {
                  state.inputForm.currentError = 'existingRss';
                  watchedInputForm.state = 'failed';
                  state.currentRss.state = 'empty';
                } else if (validRssFeed && !state.rssPaths.includes(state.inputForm.currentInput)) {
                  state.inputForm.currentError = '';
                  state.rssPaths.push(state.inputForm.currentInput);

                  const channelData = parseRss(pageContent);
                  state.currentRss.title = channelData.channelTitle;
                  state.currentRss.description = channelData.channelDescription;
                  state.currentRss.items = channelData.itemData;

                  state.parsedRss.feeds.push(channelData);
                  state.parsedRss.state = 'loaded';

                  watchedInputForm.state = 'processed';
                  watchedCurrentRss.state = 'loaded';

                  const checkForUpdates = () => {
                    state.parsedRss.state = 'checking updates';
                   // console.log(state.parsedRss.state);
                    getUpdates(state)
                      .then((updates) => {
                        if (updates !== null) {
                          watchedFeeds.state = 'updated';
                        } else {
                          state.parsedRss.state = 'no updates';
                         // console.log(state.parsedRss.state);
                        }
                        setTimeout(checkForUpdates, 5000, state, watchedFeeds);
                      })
                      .catch((error) => {
                        console.error(error);
                        setTimeout(checkForUpdates, 5000, state, watchedFeeds);
                      });
                  };

                  checkForUpdates();
                }
              })
              .catch((error) => {
                console.log(error.message);
                state.inputForm.currentError = 'urlError';
                watchedInputForm.state = 'failed';
                state.currentRss.state = 'empty';
              });
          }
        })
        .catch(() => {
          state.inputForm.currentError = 'urlError';
          watchedInputForm.state = 'failed';
          state.currentRss.state = 'empty';
        });
    });
  });
};
