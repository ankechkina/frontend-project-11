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

    const postsContainer = document.querySelector('.posts');

    postsContainer.addEventListener('click', (event) => {
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
            })
            .catch((error) => {
              if (error instanceof axios.AxiosError) {
                state.inputForm.currentError = 'networkError';
              } else {
                state.inputForm.currentError = error.message;
              }
              watchedInputForm.state = 'failed';
              state.parsedRss.state = 'empty';
            });
        })
        .catch((er) => {
          if (er instanceof axios.AxiosError) {
            state.inputForm.currentError = 'networkError';
          } else {
            state.inputForm.currentError = er.message;
          }
          watchedInputForm.state = 'failed';
          state.parsedRss.state = 'empty';
        });
    });
    const checkForUpdates = () => {
      state.parsedRss.state = 'checking updates';

      getUpdates(state)
        .then((updates) => {
          let updatesFound = false;

          updates.forEach((update, index) => {
            if (update !== null) {
              const oldPosts = state.parsedRss.posts[index];
              const newPosts = [];

              update.forEach((updatedPost) => {
                const hasSamePost = oldPosts.some((oldPost) => {
                  const isSame = oldPost.title === updatedPost.title;
                  return isSame;
                });

                if (!hasSamePost) {
                  newPosts.push(updatedPost);
                }
              });

              if (newPosts.length > 0) {
                oldPosts.push(...newPosts);
                const newPostIds = newPosts.map((post) => post.link);
                state.parsedRss.postIds.push(...newPostIds);

                updatesFound = true;
              }
            }
          });

          if (updatesFound) {
            watchedFeeds.state = 'updated';
          } else {
            state.parsedRss.state = 'no updates';
          }
        })
        .catch((err) => {
          state.inputForm.currentError = err.message;
          watchedInputForm.state = 'failed';
        })
        .finally(() => {
          setTimeout(checkForUpdates, 5000);
        });
    };
    checkForUpdates();
  });
};
