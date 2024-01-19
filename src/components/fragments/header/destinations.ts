type Destination = {
    href: string;
    label: string;
    icon: string;
};

export default [
    {
        href: "/",
        icon: "mdi:home",
        label: "Главная"
    },
    {
        href: "/posts",
        icon: "mdi:newspaper-variant-outline",
        label: "Посты"
    },
    {
        href: "/projects",
        icon: "mdi:briefcase-outline",
        label: "Проекты"
    }
] satisfies Destination[];