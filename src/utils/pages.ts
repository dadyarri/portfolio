import type { FrontmatterResult, PageMetadata } from "@type/metadata";
import matter from 'gray-matter';
import fs from 'fs';

export function extractPageMetadata(path: string): PageMetadata {

    const content = fs.readFileSync(path, 'utf-8');
    const fm = extractFrontmatterFields(content, ["title", "date", "tags"])
    
    return {
        title: fm["title"] as string,
        date: new Date(fm["date"] as string)
    }
}

function extractFrontmatterFields(content: string, fields: string[]): FrontmatterResult {
    const { data } = matter(content);

    const result: FrontmatterResult = {};

    for (const field of fields) {
        const value = data[field];
        if (typeof value === 'string' || Array.isArray(value)) {
            result[field] = value;
        }
    }

    return result;
}