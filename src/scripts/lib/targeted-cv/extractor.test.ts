import test from "node:test";
import assert from "node:assert/strict";
import { extractVacancyContent } from "./extractor.ts";

test("extractVacancyContent removes boilerplate and keeps main vacancy text", () => {
  const html = `
    <html>
      <head><title>Senior .NET Developer</title></head>
      <body>
        <header>Cookie settings</header>
        <main>
          <article>
            <h1>Senior .NET Developer</h1>
            <div class="company">Acme Corp</div>
            <p>Responsibilities</p>
            <p>Build microservices with C# and ASP.NET Core.</p>
            <p>Requirements</p>
            <p>Docker, Kubernetes, PostgreSQL.</p>
          </article>
        </main>
        <footer>Privacy policy</footer>
      </body>
    </html>
  `;

  const extracted = extractVacancyContent(html, "https://example.com/job");

  assert.equal(extracted.title, "Senior .NET Developer");
  assert.equal(extracted.company, "Acme Corp");
  assert.match(extracted.normalizedText, /Build microservices/);
  assert.match(extracted.normalizedText, /Responsibilities\nBuild microservices/);
  assert.match(extracted.normalizedText, /Requirements\nDocker, Kubernetes, PostgreSQL/);
  assert.doesNotMatch(extracted.normalizedText, /Cookie settings/);
});

test("extractVacancyContent still captures title and location for diagnostics", () => {
  const html = `
    <html>
      <head><title>Вакансия Backend-разработчик (.NET) в Москве, работа в компании КонсалтсСити</title></head>
      <body>
        <main>
          <article>
            <div data-qa="vacancy-title">Backend-разработчик (.NET)</div>
            <div data-qa="vacancy-company-name">КонсалтсСити</div>
            <div data-qa="vacancy-view-location">Москва</div>
            <p>Разработка backend-части сервисов.</p>
          </article>
        </main>
      </body>
    </html>
  `;

  const extracted = extractVacancyContent(html, "https://example.com/job");

  assert.equal(extracted.title, "Backend-разработчик (.NET)");
  assert.equal(extracted.location, "Москва");
});
