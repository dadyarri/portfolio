export type PageMetadata = {
    title: string;
    date: Date;
}

export type Paths = {
    fonts: string,
    output: string
}

export interface FrontmatterResult {
    [key: string]: string | string[] | undefined;
}