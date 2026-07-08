import { StageError } from "./errors.mjs";

export async function fetchVacancyHtml(url, cacheDir) {
  let response;

  try {
    response = await fetch(url, {
      headers: {
        "user-agent": "portfolio-targeted-cv/1.0 (+https://dadyarri.dev)",
        "accept-language": "en-US,en;q=0.8,ru;q=0.7",
      },
      redirect: "follow",
    });
  } catch (error) {
    throw new StageError(
      "fetch",
      `Failed to fetch vacancy URL. Check network access and whether the URL is reachable: ${url}`,
      { cacheDir, cause: error },
    );
  }

  if (!response.ok) {
    throw new StageError(
      "fetch",
      `Vacancy fetch failed with HTTP ${response.status} ${response.statusText}.`,
      { cacheDir },
    );
  }

  return response.text();
}
