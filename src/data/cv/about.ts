type About = {
    name: string,
    position: string,
    city: string,
    country: string,
    email: string,
    phone: {
        visible: string,
        link: string
    },
    website: string
}

export default {
    name: "Даниил Голубев",
    position: "Backend-разработчик (.NET)",
    city: "Владимир",
    country: "Россия",
    email: "me@dadyarri.ru",
    phone: {
        visible: "+7 (901) 696-58-85",
        link: "tel:+79016965885"
    },
    website: "https://dadyarri.ru"
} as About