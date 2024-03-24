/* eslint-disable no-console, import/extensions, no-param-reassign */

import { getPath, getPageContent } from './utils.js';
import parseRss from './parser.js';

// теперь нужно сделать так, чтобы проверка обновлений и перерерисовка
// работала на все загруженные фиды, а не только на первый
// с помощью forEach?
// также избавится от переопределения перменных? no-param-reassign

const getUpdates = (state) => new Promise((resolve, reject) => {
  const currentPath = state.rssPaths[0];
  const fullPath = getPath(currentPath);
  const oldChannelData = state.parsedRss.feeds[0];

  getPageContent(fullPath)
    .then((pageContent) => {
      const newChannelData = parseRss(pageContent);

      const oldTitles = oldChannelData.itemData.map((item) => item.title);
      const newTitles = newChannelData.itemData.map((item) => item.title);

      const hasUpdates = newTitles.some((title, index) => title !== oldTitles[index]);

      if (hasUpdates) {
        resolve(newChannelData);
      } else {
        resolve(null);
      }
    })
    .catch((error) => {
      reject(error);
    });
});

export default getUpdates;
