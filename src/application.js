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
import changePostsUi from './ui.js';

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
        currentError: '',
      },
      parsedRss: {
        state: 'empty',
        feeds: [],
        posts: [],
      },
      rssPaths: [],
      uiState: {
        posts: [],
        visitedIds: [],
      },
      clickedButton: {
        id: '',
      },
    };

    const validUrlSchema = yup.string().url();

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

    const watchedUiState = onChange(state.uiState, () => {
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
      const currentInput = inputValue.toLowerCase().trim();

      watchedInputForm.state = 'processing';
      state.parsedRss.state = 'processing';

      validUrlSchema.isValid(currentInput)
        .then((isValid) => {
          if (!isValid) {
            state.inputForm.currentError = 'invalidUrl';
            watchedInputForm.state = 'failed';
            state.parsedRss.state = 'empty';
          }
          if (isValid) {
            const path = getPath(currentInput);

            axios.get(path)
              .then((response) => {
                if (response.status === 200) return response.data;
                throw new Error('Bad response');
              })
              .then((data) => {
                if (state.rssPaths.includes(currentInput)) {
                  throw new Error('existingRss');
                }

                const pageContent = data.contents;
                const [feedData, itemData] = parseRss(pageContent);

                state.inputForm.currentError = '';
                state.rssPaths.push(currentInput);
                state.parsedRss.feeds.push(feedData);
                state.parsedRss.posts.push(itemData);

                watchedInputForm.state = 'processed';
                watchedFeeds.state = 'loaded';
                form.reset();

                const allPosts = state.parsedRss.posts.flat();
                let postsIds = allPosts.map((item) => item.link);

                postsIds.forEach((id) => {
                  const uiObj = { postId: id, state: 'not visited' };
                  state.uiState.posts.push(uiObj);
                });

                const postsGroup = document.querySelector('.posts-group');

                postsGroup.addEventListener('click', (event) => {
                  if (event.target.dataset.id) {
                    const currentId = event.target.dataset.id;
                    const currentPost = state.uiState.posts.find((post) => {
                      const foundPost = post.postId === currentId;
                      return foundPost;
                    });
                    currentPost.state = 'visited';

                    if (!state.uiState.visitedIds.includes(currentId)) {
                      watchedUiState.visitedIds.push(currentId);
                    }

                    if (event.target.matches('button')) {
                      state.clickedButton.id = '';
                      watchedClickedButton.id = currentId;
                    }
                  }
                });

                const checkForUpdates = () => {
                  state.parsedRss.state = 'checking updates';
                  getUpdates(state)
                    .then((updates) => {
                      const hasUpdates = updates.some((update) => update !== null);
                      if (hasUpdates) {
                        updates.forEach((update, index) => {
                          if (update !== null) {
                            state.parsedRss.posts[index] = update;
                          }
                        });
                        watchedFeeds.state = 'updated';

                        const updatedPosts = state.parsedRss.posts.flat();
                        const updatedPostIds = updatedPosts.map((item) => item.link);

                        updatedPostIds.sort();
                        postsIds.sort();

                        const hasNewPosts = updatedPostIds.some((id, index) => {
                          const result = id !== postsIds[index];
                          return result;
                        });
                        if (hasNewPosts) {
                          const newPosts = updatedPostIds.filter((id) => !postsIds.includes(id));
                          newPosts.forEach((id) => {
                            const uiObj = { postId: id, state: 'not visited' };
                            state.uiState.posts.push(uiObj);
                          });
                          postsIds = updatedPostIds;
                        }

                        postsGroup.addEventListener('click', (ev) => {
                          if (ev.target.dataset.id) {
                            const currentId = ev.target.dataset.id;
                            const currentPost = state.uiState.posts.find((post) => {
                              const foundPost = post.postId === currentId;
                              return foundPost;
                            });
                            currentPost.state = 'visited';

                            if (!state.uiState.visitedIds.includes(currentId)) {
                              watchedUiState.visitedIds.push(currentId);
                            }

                            if (ev.target.matches('button')) {
                              state.clickedButton.id = '';
                              watchedClickedButton.id = currentId;
                            }
                          }
                        });
                      } else {
                        state.parsedRss.state = 'no updates';
                      }
                      setTimeout(checkForUpdates, 5000);
                    })
                    .catch(() => {
                      state.inputForm.currentError = 'networkError';
                      watchedInputForm.state = 'failed';
                      setTimeout(checkForUpdates, 5000);
                    });
                };
                checkForUpdates();
              })
              .catch((error) => {
                if (error.message === 'invalidRss') {
                  state.inputForm.currentError = 'invalidRss';
                  watchedInputForm.state = 'failed';
                  state.parsedRss.state = 'empty';
                } else if (error.message === 'existingRss') {
                  state.inputForm.currentError = 'existingRss';
                  watchedInputForm.state = 'failed';
                  state.parsedRss.state = 'empty';
                } else {
                  state.inputForm.currentError = 'networkError';
                  watchedInputForm.state = 'failed';
                  state.parsedRss.state = 'empty';
                }
              });
          }
        })
        .catch(() => {
          state.inputForm.currentError = 'networkError';
          watchedInputForm.state = 'failed';
          state.parsedRss.state = 'empty';
        });
    });
  });
};
