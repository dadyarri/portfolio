declare module 'remark-code-titles' {
    import { Plugin } from 'unified';

    interface RemarkCodeTitlesOptions {
        // Add any options if needed
    }

    const remarkCodeTitles: (options?: RemarkCodeTitlesOptions) => Plugin;

    export = remarkCodeTitles;
}