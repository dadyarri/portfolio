export type Tag = {
    id: string,
    label: string,
    icon?: string
};

export default [
    {
        id: "asciidoc",
        label: "Asciidoc",
        icon: "mdi:file-document"
    },
    {
        id: "astro",
        label: "Astro",
        icon: "mdi:rocket-outline"
    },
    {
        id: "csharp",
        label: "C#",
        icon: "mdi:language-csharp"
    },
    {
        id: "exp",
        label: "Мой опыт",
        icon: "mdi:account-clock"
    },
    {
        id: "translation",
        label: "Перевод",
        icon: "mdi:translate"
    },
    {
        id: "typescript",
        label: "TypeScript",
        icon: "mdi:language-typescript"
    },
    {
        id: "android",
        label: "Android",
        icon: "mdi:android"
    },
    {
        id: "kotlin",
        label: "Kotlin",
        icon: "mdi:language-kotlin"
    },
    {
        id: "coding",
        label: "Программирование",
        icon: "mdi:code-json"
    },
    {
        id: "wpf",
        label: "WPF",
        icon: "mdi:microsoft-windows"
    },
    {
        id: "postgres",
        label: "PostgreSQL",
        icon: "mdi:database"
    },
    {
        id: "python",
        label: "Python",
        icon: "mdi:language-python"
    },
] satisfies Tag[];