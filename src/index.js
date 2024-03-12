/* eslint-disable no-console, no-unused-vars, prefer-destructuring */

import './styles.scss';
import 'bootstrap';
import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';

const state = {
  currentInput: '',
  isValid: true,
  currentError: '',
  rssFeeds: [],
};

const getPath = (url) => `https://allorigins.hexlet.app/get?url=${encodeURIComponent(url)}`;
const validUrlSchema = yup.string().url('Неправильный формат URL');

const isValidRss = (site) => site.includes('<rss') || site.includes('<channel');

const form = document.querySelector('form');
const urlInput = document.querySelector('#url-input');
const feedbackMessage = document.querySelector('.feedback');
const submitButton = document.querySelector('button[type="submit"]');

const render = () => {
  // console.log('state changed!');
  // сначала убираем оба класса, чтобы наверняка, а потом уже добавляем нужные
  urlInput.classList.remove('is-invalid');
  feedbackMessage.classList.remove('text-danger');
  feedbackMessage.classList.remove('text-success');
  feedbackMessage.textContent = '';

  if (!state.isValid) {
    urlInput.classList.add('is-invalid');
    feedbackMessage.classList.add('text-danger');
    feedbackMessage.textContent = state.currentError;
  } else if (state.isValid && state.rssFeeds.length !== 0) {
    // если состояние валидно и массив rss feeds не пустой, то все прошло успешно
    feedbackMessage.classList.add('text-success');
    feedbackMessage.textContent = 'RSS успешно загружен';
  }
  submitButton.disabled = false;
};

const watchedState = onChange(state, render);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  submitButton.disabled = true;

  // очищаем ошибки в state перед каждым сценарием, чтобы watchedState мог измениться
  state.isValid = true;
  state.currentError = '';

  const formData = new FormData(e.target);
  const inputValue = formData.get('url');
  const normalizedInput = inputValue.toLowerCase().trim();

  state.currentInput = normalizedInput;
  form.reset();

  validUrlSchema.isValid(state.currentInput)
    .then((isValid) => {
      if (!isValid) {
        state.currentError = 'Невалидный адрес URL';
        watchedState.isValid = false;
      }
      if (isValid) {
        const path = getPath(state.currentInput);

        fetch(path)
          .then((response) => {
            if (response.ok) return response.json();
            watchedState.currentError = 'Проблемы с ответом от сервера';
            return Promise.reject();
            // throw new Error('Network response was not ok.');
          })
          .then((data) => {
            const pageContent = data.contents;
            const validRssFeed = isValidRss(pageContent);

            if (!validRssFeed) {
              state.currentError = 'Невалидный адрес RSS';
              watchedState.isValid = false;
            } else if (validRssFeed && !state.rssFeeds.includes(state.currentInput)) {
              state.currentError = '';
              state.isValid = true;
              watchedState.rssFeeds.push(state.currentInput);
            } else if (validRssFeed && state.rssFeeds.includes(state.currentInput)) {
              state.currentError = 'RSS уже существует';
              watchedState.isValid = false;
            }
          });
      }
    })
    .catch((error) => {
      state.currentError = `Ошибка при проверке URL: ${error.message}`;
      watchedState.isValid = false;
    });
});
