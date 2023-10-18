import getReadingTime from 'reading-time';
import type { Root } from "mdast"

import { toString } from 'mdast-util-to-string';

/** @type {import('unified').Plugin<[Options]>} */
export function remarkReadingTime() {
  return function (tree: Root, { data }: {data: any}) {
    const textOnPage = toString(tree);
    const readingTime = getReadingTime(textOnPage);
    data.astro.frontmatter.minutesRead = Math.ceil(readingTime.minutes);
  };
}