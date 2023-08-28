type Social = {
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
  title: "Салют, я Даниил",
  description:
    "Бэкенд-разработчик из России *с двухлетним опытом*. Сейчас я изучаю *ASP.NET* и *Jetpack Compose*",
  socials: [
    {
      label: "Github",
      link: "https://github.com/dadyarri",
    },
    {
      label: "Telegram",
      link: "https://t.me/dadyarri"
    },
    {
      label: "Резюме",
      link: "/assets/cv.pdf"
    }
  ],
};

export default presentation;
