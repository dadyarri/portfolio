type Social = {
  icon: string,
  label: string;
  link: string;
};

type Presentation = {
  mail: string;
  title: string;
  description: string;
  socials: Social[];
};

const presentation: Presentation = {
  mail: "me@dadyarri.ru",
  title: "Салют, я Даниил 👋",
  description:
    "Бэкенд-разработчик из России *с двухлетним опытом*. Сейчас я изучаю *ASP.NET* и *Jetpack Compose*",
  socials: [
    {
      icon: "mdi:github",
      label: "Github",
      link: "https://github.com/dadyarri",
    },
    {
      icon: "mdi:telegram",
      label: "Telegram",
      link: "https://t.me/dadyarri"
    },
    {
      icon: "mdi:email",
      label: "Электропочта",
      link: "mailto:me@dadyarri.ru"
    },
    {
      icon: "mdi:paperclip",
      label: "Резюме",
      link: "/cv"
    }
  ],
};

export default presentation;
