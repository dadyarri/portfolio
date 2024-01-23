<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:ms="urn:schemas-microsoft-com:xslt"
  xmlns:dt="urn:schemas-microsoft-com:datatypes">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title>
          <xsl:value-of select="/rss/channel/title"/>
        </title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        <link type="text/css" rel="stylesheet" href="/assets/style.css"></link>
      </head>
      <body class="bg-white">
        <div class="container-md px-3 py-3 markdown-body">
          <header class="py-5">
            <h1 class="border-0 flex items-center">
              <!-- https://commons.wikimedia.org/wiki/File:Feed-icon.svg -->
              <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style="vertical-align: text-bottom; width: 32px; height: 32px" class="pr-1" id="RSSicon" viewBox="0 0 25 25">
                <path fill="black" d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m2.5 12A1.5 1.5 0 0 0 6 16.5A1.5 1.5 0 0 0 7.5 18A1.5 1.5 0 0 0 9 16.5A1.5 1.5 0 0 0 7.5 15M6 10v2a6 6 0 0 1 6 6h2a8 8 0 0 0-8-8m0-4v2a10 10 0 0 1 10 10h2A12 12 0 0 0 6 6"/>
              </svg>

              Предпросмотр ленты постов
            </h1>
            <h2>
              <xsl:value-of select="/rss/channel/title"/>
            </h2>
            <p>
              <xsl:value-of select="/rss/channel/description"/>
            </p>
            <a target="_blank">
              <xsl:attribute name="href">
                <xsl:value-of select="/rss/channel/link"/>
              </xsl:attribute>
              Открыть сайт &#x2192;
            </a>
          </header>
          <h2>Статьи в блоге</h2>
          <xsl:for-each select="/rss/channel/item">
            <div class="pb-5">
              <h3 class="mb-0">
                <a target="_blank">
                  <xsl:attribute name="href">
                    <xsl:value-of select="link"/>
                  </xsl:attribute>
                  <xsl:value-of select="title"/>
                </a>
              </h3>
              <small class="text-gray">
                <span>Дата публикации: </span>
                <xsl:variable name="pubDate" select="substring(pubDate, 6, 11)" />
                <xsl:value-of select="concat(substring($pubDate, 1, 2), ' ', substring($pubDate, 4, 3), substring(pubDate, 12, 5))" />
              </small>
            </div>
          </xsl:for-each>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>