---
title: "FOR UPDATE в SELECT запросе"
publishedAt: 2023-09-10
tags: ["PostgreSQL"]
source: https://postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE
---

Для того, чтобы заблокировать строку на время обновления можно выполнить запрос `SELECT FOR UPDATE`, тогда она будет станет недоступна. Блокировка автоматически снимется после завершения транзакции.