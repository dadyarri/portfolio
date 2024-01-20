type Tag = {
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
        id: "csharp",
        label: "C#",
        icon: "mdi:language-sharp"
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
        id: "android",
        label: "Android",
        icon: "mdi:android"
    },
    {
        id: "kotlin",
        label: "Kotlin",
        icon: "mdi: language-kotlin"
    },
    {
        id: "coding",
        label: "Программирование",
        icon: "mdi:code-json"
    }
] satisfies Tag[];