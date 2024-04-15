import './styles.scss';
import 'bootstrap';
import onChange from 'on-change';
import axios from 'axios';
import i18n from 'i18next';
import ru from './locales/ru.js';
import { renderFeedback, renderContent, showModalWindow } from './view.js';
import parseRss from './parser.js';
import getUpdates from './updates.js';
import { getPath, createValidUrlSchema } from './utils.js';
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
        postIds: [],
      },
      rssPaths: [],
      uiState: {
        visitedIds: [],
      },
      clickedButton: {
        id: '',
      },
    };

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

      const validUrlSchema = createValidUrlSchema(state.rssPaths);

      validUrlSchema.validate(currentInput)
        .then(() => {
          const path = getPath(currentInput);

          axios.get(path)
            .then((response) => {
              if (response.status === 200) return response.data;
              throw new Error('networkError');
            })
            .then((data) => {
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
              const postIds = allPosts.map((item) => item.link);

              state.parsedRss.postIds = postIds;

              const postsGroup = document.querySelector('.posts-group');

              postsGroup.addEventListener('click', (event) => {
                if (event.target.dataset.id) {
                  const currentId = event.target.dataset.id;

                  if (!state.uiState.visitedIds.includes(currentId)) {
                    watchedUiState.visitedIds.push(currentId);
                  }

                  if (event.target.matches('button')) {
                    state.clickedButton.id = '';
                    watchedClickedButton.id = currentId;
                  }
                }
              });
            })
            .catch((error) => {
              if (error.message === 'invalidRss') {
                state.inputForm.currentError = 'invalidRss';
                watchedInputForm.state = 'failed';
                state.parsedRss.state = 'empty';
              } else {
                state.inputForm.currentError = 'networkError';
                watchedInputForm.state = 'failed';
                state.parsedRss.state = 'empty';
              }
            });
        })
        .catch((er) => {
          if (er.message === 'invalidUrl') {
            state.inputForm.currentError = 'invalidUrl';
            watchedInputForm.state = 'failed';
            state.parsedRss.state = 'empty';
          } else if (er.message === 'existingRss') {
            state.inputForm.currentError = 'existingRss';
            watchedInputForm.state = 'failed';
            state.parsedRss.state = 'empty';
          } else {
            state.inputForm.currentError = 'networkError';
            watchedInputForm.state = 'failed';
            state.parsedRss.state = 'empty';
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
              state.parsedRss.posts[index] = update;
            });
            watchedFeeds.state = 'updated';

            const updatedPosts = state.parsedRss.posts.flat();
            const updatedPostIds = updatedPosts.map((item) => item.link);
            const oldPostIds = state.parsedRss.postIds;

            updatedPostIds.sort();
            oldPostIds.sort();

            const hasNewPosts = updatedPostIds.some((id, index) => {
              const result = id !== oldPostIds[index];
              return result;
            });
            if (hasNewPosts) {
              state.parsedRss.postIds = updatedPostIds;
            }

            const postsGroup = document.querySelector('.posts-group');

            postsGroup.addEventListener('click', (ev) => {
              if (ev.target.dataset.id) {
                const currentId = ev.target.dataset.id;

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
        })
        .catch(() => {
          state.inputForm.currentError = 'networkError';
          watchedInputForm.state = 'failed';
        })
        .finally(() => {
          setTimeout(checkForUpdates, 5000);
        });
    };
    checkForUpdates();
  });
};
