// import { v4 as uuidv4 } from 'uuid';

export const slugify = (title: string) => {
  // the slug is formed like this
  // /@username/title-like-this-postid
  let slug = "";
  //    const uuidStr = uuidv4();

  //   turn title to lowercase
  const lowercasedTitle = title.toLowerCase();
  // split title each word in array
  const splitted = lowercasedTitle.split(" ");
  // append a dash to each word except the last word

  splitted.forEach((item, index) => {
    if (index < splitted.length - 1) {
      slug += `${item}-`;
    }

    if (index === splitted.length - 1) {
      slug += item;
    }
  });

  //   return `@${username}/${slug}-${uuidStr}`;
  return slug;
};
