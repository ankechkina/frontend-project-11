/* eslint-disable no-console, no-unused-vars, prefer-destructuring */

import './styles.scss';
import 'bootstrap';
import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';

const state = {
  currentInput: '',
  isValid: true,
  errors: [],
  rssFeeds: [],
};

const getPath = (url) => `https://allorigins.hexlet.app/get?url=${encodeURIComponent(url)}`;
const validUrlSchema = yup.string().url('Неправильный формат URL');

const form = document.querySelector('form');
const urlInput = document.querySelector('#url-input');
const errorMessageField = document.querySelector('.text-danger');

const render = () => {
  if (state.isValid === false) {
    urlInput.classList.add('is-invalid');
    errorMessageField.textContent = state.errors[0];
  } else if (state.isValid === true) {
    urlInput.classList.remove('is-invalid');
    errorMessageField.textContent = '';
  }
};

const watchedState = onChange(state, render);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const inputValue = formData.get('url');
  state.currentInput = inputValue;
  form.reset();

  validUrlSchema.isValid(inputValue)
    .then((isValid) => {
      console.log(`${inputValue} - ${isValid ? 'Валидный URL' : 'Невалидный URL'}`);
      if (!isValid && state.errors.length === 0) {
        state.errors.push('Невалидный URL');
        watchedState.isValid = false;
      }
      if (isValid) {
        state.errors = [];
        watchedState.isValid = true;
      }
    })
    .catch((error) => {
      console.error(`Ошибка при проверке URL: ${error.message}`);
    });

  console.log(state);
  const path = getPath(inputValue);
});

// будем добавлять в состояние только валидный rss поток
//
