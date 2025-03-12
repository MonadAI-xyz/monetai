/** 
 * Replace multiple different words in a string 
 * @param str String
 * @param replacements Object
 * @return String
 */
export const replaceMultipleWords = (str: string, replacements: {[k: string]: string}) => {
  return Object.keys(replacements).reduce((acc, word) => {
    return acc.replace(new RegExp(word, 'gi'), replacements[word]);
  }, str);
}

// const text = "Hello world! JavaScript is amazing. Welcome to the world of coding.";
// const replacements = {
//   "world": "universe",
//   "JavaScript": "TypeScript"
// };