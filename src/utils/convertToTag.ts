export function convertToTag(tagName: string): string {
    return tagName.replace(" ", "-").replace("#", "sharp").toLowerCase()
}