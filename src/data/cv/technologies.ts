type TechnologyBlock = {
    name: string,
    technologies: Technology[]
}

type Technology = {
    name: string
    frameworks: string[]
}

export default [
    {
        name: "Бэкенд",
        technologies: [
            {
                name: "C#",
                frameworks: [
                    "ASP.NET"
                ]
            }
        ]
    },
    // {
    //     name: "Брокеры сообщений",
    //     technologies: [
    //         {
    //             name: "RabbitMQ",
    //             frameworks: [
    //                 "MassTransit"
    //             ]
    //         }
    //     ]
    // },
    {
        name: "Настольные приложения",
        technologies: [
            {
                name: "C#",
                frameworks: [
                    "WPF"
                ]
            }
        ]
    },
    {
        name: "Мобильные приложения",
        technologies: [
            {
                name: "Kotlin",
                frameworks: [
                    "Jetpack Compose",
                ]
            }
        ]
    },
    {
        name: "Инструменты командной разработки",
        technologies: [
            {
                name: "Git",
                frameworks: []
            },
            {
                name: "Trello",
                frameworks: []
            },
            {
                name: "Jira",
                frameworks: []
            },
            {
                name: "Jetbrains Space",
                frameworks: []
            }
        ]
    },
    {
        name: "CI/CD",
        technologies: [
            {
                name: "Github Actions",
                frameworks: []
            }
        ]
    },
    {
        name: "СУБД",
        technologies: [
            {
                name: "PostgreSQL",
                frameworks: []
            },

        ]
    },
    {
        name: "Системы контейнеризации",
        technologies: [
            {
                name: "Docker",
                frameworks: [
                    "Docker Compose"
                ]
            }
        ]
    },
    {
        name: "Скриптовое программирование",
        technologies: [
            {
                name: "Python",
                frameworks: []
            },
            {
                name: "Bash",
                frameworks: []
            },
            {
                name: "Powershell",
                frameworks: []
            }
        ]
    },
    {
        name: "Операционные системы",
        technologies: [
            {
                name: "Windows",
                frameworks: []
            },
            {
                name: "Debian",
                frameworks: []
            },
            {
                name: "Arch",
                frameworks: []
            },
            {
                name: "Fedora",
                frameworks: []
            }

        ]
    }
] as TechnologyBlock[]