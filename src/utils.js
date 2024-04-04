import axios from 'axios';

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

export { getPath, getPageContent };
