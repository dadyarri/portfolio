type Workplace = {
    company: {
        name: string,
        link: string
    },
    position: string,
    times: string,
    description: string[]
}

export default [
    {
        company: {
            name: "Академия Top",
            link: "https://vlad.top-academy.ru/"
        },
        position: "Преподаватель компьютерных курсов",
        times: "Июнь — Сентябрь 2021",
        description: [
            "Вёл групповые технические курсы у детей 6-14 лет (Python, Windows, Основы работы с интернетом, Gimp и пр.)"
        ]
    }
] as Workplace[]