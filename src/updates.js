import { getPath, getPageContent } from './utils.js';
import parseRss from './parser.js';

const getUpdates = (state) => {
  const promises = state.rssPaths.map((path, index) => {
    const fullPath = getPath(path);
    const oldPostsData = state.parsedRss.posts[index];

    return getPageContent(fullPath)
      .then((pageContent) => {
        const [, newPostsData] = parseRss(pageContent);

        const oldTitles = oldPostsData.map((item) => item.title);
        const newTitles = newPostsData.map((item) => item.title);

        const hasUpdates = newTitles.some((title, i) => title !== oldTitles[i]);

        if (hasUpdates) {
          return newPostsData;
        }
        return null;
      })
      .catch(() => {
        throw new Error('updateError');
      });
  });
  return Promise.all(promises);
};

export default getUpdates;
