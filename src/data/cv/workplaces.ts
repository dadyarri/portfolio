type Workplace = {
    company: {
        name: string,
        link: string,
        logoLink: string,
    },
    position: string,
    times: string,
    description: string[]
}

export default [
    {
        company: {
            name: "Академия Top",
            link: "https://vlad.top-academy.ru/",
            logoLink: "https://vlad.top-academy.ru/dist/images/logo/step_logo_rus.svg"
        },
        position: "Преподаватель компьютерных курсов",
        times: "Июнь — Сентябрь 2021",
        description: [
            "Преподавал групповые технические курсы для детей в возрасте 6-14 лет, охватывающие различные темы, включая программирование на Python, операционную систему Windows, основы работы с Интернетом и программное обеспечение для редактирования изображений Gimp.",
            "Разработал и внедренил интерактивную учебную программу для ИТ-курсов, ориентированных на детей, включающая увлекательные мероприятия и практические упражнения, что привело к увеличению вовлеченности учащихся на 30% и улучшению общего показателя завершения курса на 25%."
        ]
    },
    {
        company: {
            name: "ГК «Системы и технологии»",
            link: "https://sicon.ru",
            logoLink: "https://sicon.ru/local/templates/main/images/logo.svg"
        },
        position: "Бэкенд-разработчик (.NET)",
        times: "Январь 2023 — Настоящее время",
        description: [
            "Участвовал в распиле монолитного приложения на микросервисы"
        ]
    }
] satisfies Workplace[]