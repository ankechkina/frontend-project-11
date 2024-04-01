/* eslint-disable import/extensions */

import './styles.scss';
import 'bootstrap';
import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';
import i18n from 'i18next';
import ru from './locales/ru.js';
import { renderFeedback, renderContent, showModalWindow } from './view.js';
import parseRss from './parser.js';
import getUpdates from './updates.js';
import { getPath } from './utils.js';
import { getPostsIds, changePostsUi } from './ui.js';

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
      parsedRss: {
        state: 'empty',
        feeds: [],
      },
      rssPaths: [],
      uiState: {
        posts: [],
        visitedIds: [],
      },
      clickedButton: {
        id: 0,
      },
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

    const modalElements = {
      modalTitle: document.querySelector('.modal-title'),
      modalBody: document.querySelector('.modal-body'),
      modalButton: document.querySelector('.modal-footer > .full-article'),
    };

    const watchedInputForm = onChange(state.inputForm, () => {
      renderFeedback(state, feedbackElements, i18nInstance);
    });

    const watchedFeeds = onChange(state.parsedRss, () => {
      renderContent(state, contentElements, i18nInstance);
    });

    const watchedUiState = onChange(state.uiState.posts, () => {
      changePostsUi(state);
    });

    const watchedClickedButton = onChange(state.clickedButton, () => {
      showModalWindow(state, modalElements);
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
      state.parsedRss.state = 'processing';

      if (state.inputForm.currentInput === '') {
        state.inputForm.currentError = 'emptyField';
        watchedInputForm.state = 'failed';
        state.parsedRss.state = 'empty';
      }

      validUrlSchema.isValid(state.inputForm.currentInput)
        .then((isValid) => {
          if (!isValid) {
            state.inputForm.currentError = 'invalidUrl';
            watchedInputForm.state = 'failed';
            state.parsedRss.state = 'empty';
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
                  state.parsedRss.state = 'empty';
                } else if (validRssFeed && state.rssPaths.includes(state.inputForm.currentInput)) {
                  state.inputForm.currentError = 'existingRss';
                  watchedInputForm.state = 'failed';
                  state.parsedRss.state = 'empty';
                } else if (validRssFeed && !state.rssPaths.includes(state.inputForm.currentInput)) {
                  state.inputForm.currentError = '';
                  state.rssPaths.push(state.inputForm.currentInput);

                  const channelData = parseRss(pageContent);
                  state.parsedRss.feeds.push(channelData);

                  let postCounter = 0;

                  state.parsedRss.feeds.forEach((feed, feedIndex) => {
                    feed.itemData.forEach((item, index) => {
                      state.parsedRss.feeds[feedIndex].itemData[index].id = postCounter;
                      postCounter += 1;
                    });
                  });

                  watchedInputForm.state = 'processed';
                  watchedFeeds.state = 'loaded';

                  const postsIds = getPostsIds();

                  postsIds.forEach((id) => {
                    const uiObj = { postId: id, state: 'not visited' };
                    state.uiState.posts.push(uiObj);
                  });

                  const postLinks = document.querySelectorAll('a[data-id]');
                  const postButtons = document.querySelectorAll('button[data-id]');

                  postLinks.forEach((link) => {
                    link.addEventListener('click', (ev) => {
                      const currentId = parseInt(ev.target.dataset.id, 10);
                      const currentPost = watchedUiState.find((post) => post.postId === currentId);
                      currentPost.state = 'visited';

                      if (!state.uiState.visitedIds.includes(currentId)) {
                        state.uiState.visitedIds.push(currentId);
                      }
                    });
                  });

                  postButtons.forEach((button) => {
                    button.addEventListener('click', (event) => {
                      const currentId = parseInt(event.target.dataset.id, 10);
                      const currentPost = watchedUiState.find((post) => {
                        const currPost = post.postId === parseInt(currentId, 10);
                        return currPost;
                      });
                      currentPost.state = 'visited';

                      state.clickedButton.id = 0;
                      watchedClickedButton.id = currentId;

                      if (!state.uiState.visitedIds.includes(currentId)) {
                        state.uiState.visitedIds.push(currentId);
                      }
                    });
                  });

                  const checkForUpdates = () => {
                    state.parsedRss.state = 'checking updates';
                    getUpdates(state)
                      .then((updates) => {
                        const hasUpdates = updates.some((update) => update !== null);
                        if (hasUpdates) {
                          updates.forEach((update, index) => {
                            if (update !== null) {
                              state.parsedRss.feeds[index] = update;
                            }
                          });
                          watchedFeeds.state = 'updated';
                        } else {
                          state.parsedRss.state = 'no updates';
                        }
                        setTimeout(checkForUpdates, 5000);
                      })
                      .catch(() => {
                        state.inputForm.currentError = 'urlError';
                        watchedInputForm.state = 'failed';
                        setTimeout(checkForUpdates, 5000);
                      });
                  };
                  checkForUpdates();
                }
              })
              .catch(() => {
                state.inputForm.currentError = 'urlError';
                watchedInputForm.state = 'failed';
                state.parsedRss.state = 'empty';
              });
          }
        })
        .catch(() => {
          state.inputForm.currentError = 'urlError';
          watchedInputForm.state = 'failed';
          state.parsedRss.state = 'empty';
        });
    });
  });
};
