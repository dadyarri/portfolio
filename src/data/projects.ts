export type Project = {
  title: string;
  techs: string[];
  link?: string;
  description?: string;
  isComingSoon?: boolean;
};

const projects: Project[] = [
  {
    title: "ChocoManager. Backend",
    techs: ["C#", "ASP.NET", "Docker"],
    link: "https://github.com/choco-manager/Backend",
    description: "Бэк-офис небольшого интернет-магазина"
  },
  {
    title: "ChocoManager. Application",
    techs: ["Kotlin", "Jetpack Compose"],
    link: "https://github.com/choco-manager/Application",
    description: "Мобильное приложение для бэк-офиса интернет магазина",
    isComingSoon: true
  },
  {
    title: "AudioSplttr",
    techs: ["C#", "WPF"],
    description: "Приложение, разделяющее аудиодорожку на фрагменты по уровню тишины"
  }
];

export default projects;
