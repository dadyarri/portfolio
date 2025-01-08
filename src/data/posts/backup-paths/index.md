---
title:  "Пути для бэкапа приложений"
date:  "2024-12-22"
draft:  false

tags:  ["Бэкап"]
category: "minis"

---

Собрал свой список приложений и пути, где они хранят свои конфиги, чтобы ничего не потерять при бэкапе

<!--more-->

# Установленные через `winget` приложения

`winget export -o path-to-file.json` сохранит список установленных приложений, `winget import path-to-file.json` установит все приложения из этого списка

# Brave (любой Chromium браузер)

- `%LOCALAPPDATA%\BraveSoftware\Brave-Browser\User Data\Default` &mdash; Базовая директория пользовательских данных
  - `Bookmarks` &mdash; Закладки
  - `Preferences` &mdash; Настройки
  - `Secure Preferences` &mdash; Настройки безопасности
  - `Top Sites` &mdash; Часто посещаемые сайты
  - `History` &mdash; История посещений, загрузок

# SSH

- `%USERPROFILE%\.ssh` &mdash; SSH-ключи

# GnuPG

Писал об этом отдельную [шпаргалку](/minis/backup-gpg)

# Git

- `%USERPROFILE%\.gitconfig` (или, как у меня `%USERPROFILE%\.config\git\config`) &mdash; Глобальные настройки

# PowerShell

- `%USERPROFILE%\Documents\PowerShell\Microsoft.PowerShell_profile.ps1` &mdash; Профиль PowerShell

# Alacritty (эмулятор терминала)

- `%APPDATA%\alacritty\alacritty.toml` &mdash; Конфиг терминала

# Visual Studio Code

- `%APPDATA%\Code\User\settings.json` &mdash; Настройки
- `%USERPROFILE%\.vscode\extensions\extensions.json` &mdash; Список расширений
- `%USERPROFILE%\.vscode\argv.json` &mdash; Глобальные аргументы для запуска

# Logitech G HUB

- `%LOCALAPPDATA%\LGHUB\settings.db` &mdash; Настройки устройств и самого приложения

# PowerToys

Нужно вручную экпортировать данные (General -> Backup & Restore)