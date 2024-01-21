type Course = {
    name: string,
    authors: string[],
    platform: string,
    link: string,
    description?: string
}

export default [
    {
        name: "Введение в Linux",
        authors: [
            "Bioinformatics Institute"
        ],
        platform: "Stepik",
        link: "https://stepik.org/cert/2277262",
        description: "Закончил с отличием"
    }
] as Course[]