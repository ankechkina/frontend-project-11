import axios from 'axios';
import * as yup from 'yup';

const createValidUrlSchema = (rssPaths) => yup.string().url('invalidUrl').notOneOf(rssPaths, 'existingRss');

const getPath = (url) => `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;

const getPageContent = (path) => axios.get(path)
  .then((response) => {
    if (response.status === 200) return response.data;
    throw new Error('Bad response');
  })
  .then((data) => {
    const pageContent = data.contents;
    return pageContent;
  });

export { getPath, getPageContent, createValidUrlSchema };
