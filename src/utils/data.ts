const MORE_MARKER = "<!--more-->";
const FIRST_PARAGRAPH_PATTERN = /<p\b[^>]*>[\s\S]*?<\/p>/i;

export function getPreviewHtml(
    html: string,
    marker: string = MORE_MARKER,
): string {
    if (!html) {
        return "";
    }

    if (html.includes(marker)) {
        return html.split(marker, 1)[0].trim();
    }

    const firstParagraph = html.match(FIRST_PARAGRAPH_PATTERN)?.[0];

    if (firstParagraph) {
        return firstParagraph.trim();
    }

    return html.trim();
}

function stripHtml(input: string): string {
    return input.replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, " ").trim();
}

export function getPreviewText(
    html: string,
    marker: string = MORE_MARKER,
): string {
    return stripHtml(getPreviewHtml(html, marker));
}
