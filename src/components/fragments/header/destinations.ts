type Destination = {
    href: string;
    label: string;
};

export default [
    {
        href: "/",
        label: "Главная"
    },
    {
        href: "/posts",
        label: "Посты"
    },
    {
        href: "/projects",
        label: "Проекты"
    }
] satisfies Destination[];