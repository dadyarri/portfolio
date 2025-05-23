export function splitArrayByElement(array: string[], element: string): { preview: string[]; content: string[] } {
    const index = array.indexOf(element);

    if (index === -1) {
        throw new Error(`Element "${element}" not found in the array.`);
    }

    const preview = array.slice(0, index);
    const content = array.slice(index + 1);

    return { preview, content };
}

export function stripHtml(input: string): string {
    // Use a regular expression to match HTML tags and replace them with an empty string
    return input.replace(/<\/?[^>]+(>|$)/g, "");
}