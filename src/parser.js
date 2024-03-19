export default (pageContent) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(pageContent, 'text/xml');
  const channelTags = xmlDoc.getElementsByTagName('channel')[0].children;

  const tagsArray = Array.from(channelTags);

  const titleEl = tagsArray.find((el) => el.tagName === 'title');
  const channelTitle = titleEl.textContent;

  const descriptionEl = tagsArray.find((el) => el.tagName === 'description');
  const channelDescription = descriptionEl.textContent;

  const items = tagsArray.filter((el) => el.tagName === 'item');

  const itemData = [];

  items.forEach((item) => {
    const currentItemData = {
      title: item.querySelector('title').textContent,
      link: item.querySelector('link').textContent,
      description: item.querySelector('description').textContent,
    };
    itemData.push(currentItemData);
  });

  return {
    channelTitle,
    channelDescription,
    itemData,
  };
};
