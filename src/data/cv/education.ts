type Education = {
    name: string,
    city: string,
    times: string,
    speciality: string,
    activities: string[]
}

export default [
    {
        name: "ВлГУ",
        city: "Владимир",
        times: "2020 — 2024",
        speciality: "Информационные системы и технологии",
        activities: [
            "Основы программирования (C#, Java)",
            "Базы данных и SQL",
            "Сетевые технологии",
            "Анализ данных",
            "Проектирование информационных систем",
          ]
    }
] as Education[]