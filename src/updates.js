/* eslint-disable import/extensions */

import { getPath, getPageContent } from './utils.js';
import parseRss from './parser.js';

const getUpdates = (state) => {
  const promises = state.rssPaths.map((path, index) => {
    const fullPath = getPath(path);
    const oldChannelData = state.parsedRss.feeds[index];

    return getPageContent(fullPath)
      .then((pageContent) => {
        const newChannelData = parseRss(pageContent);

        const oldTitles = oldChannelData.itemData.map((item) => item.title);
        const newTitles = newChannelData.itemData.map((item) => item.title);

        const hasUpdates = newTitles.some((title, ind) => title !== oldTitles[ind]);

        if (hasUpdates) {
          return newChannelData;
        }
        return null;
      });
  });
  return Promise.all(promises);
};

export default getUpdates;
