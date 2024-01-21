export type Social = {
  icon: string;
  label: string;
  link: string;
};

export type Presentation = {
  mail: string;
  title: string;
  description: string[];
  socials: Social[];
};

export default {
  mail: "me@dadyarri.ru",
  title: "Салют, я Даниил 👋",
  description: [
    "Бэкенд-разработчик (.NET) в **ГК «Системы и технологии»**",
    "Живу во Владимире, Россия"
  ],
  socials: [
    {
      icon: "mdi:github",
      label: "Github",
      link: "https://github.com/dadyarri",
    },
    {
      icon: "mdi:telegram",
      label: "Telegram",
      link: "https://t.me/dadyarri",
    },
    {
      icon: "mdi:email",
      label: "Электропочта",
      link: "mailto:me@dadyarri.ru",
    },
    {
      icon: "mdi:paperclip",
      label: "Резюме",
      link: "/cv",
    },
  ],
} as Presentation;
