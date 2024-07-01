import getReadingTime from 'reading-time'
import Options from 'reading-time'
import { toString } from 'mdast-util-to-string'

/**
 * Injects `minutesRead` into frontmatter processed by Remark.
 */
export function remarkReadingTime() {
	return function (tree: unknown, { data }: any) {
		const textOnPage = toString(tree)
		const readingTime = getReadingTime(textOnPage)
		// readingTime.minutes will give us minutes read as a number,
		// i.e. 3
		data.astro.frontmatter.minutesRead = Math.ceil(readingTime.minutes)
	}
}
