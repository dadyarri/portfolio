export function splitArrayByElement(array: string[], element: string): { preview: string[]; content: string[] } {
    const index = array.indexOf(element);

    if (index === -1) {
        throw new Error(`Element "${element}" not found in the array.`);
    }

    const preview = array.slice(0, index);
    const content = array.slice(index + 1);

    return { preview, content };
}