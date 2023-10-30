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
            "Изучал разработку на C#, Java",
            "Изучал проектирование проектов (диаграммы UML, IDEF)"
        ]
    }
] as Education[]