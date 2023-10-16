import fs from "fs/promises";
import type { APIRoute } from "astro";
import { getCollection, getEntryBySlug } from "astro:content";
import satori from "satori";
import sharp from "sharp";
import formatDate from "@/utils/formatDate";
import getReadingTime from 'reading-time';

export async function getStaticPaths() {
    const posts = await getCollection("posts");
    return posts.map((post) => ({
        params: { slug: post.slug },
        props: post,
    }));
}

export const GET: APIRoute = async ({ params }) => {
    const page = (await getEntryBySlug("posts", params.slug!))!;
    const openSansData = await fs.readFile("./public/fonts/open-sans/OpenSans-Regular.ttf");
    const readingTime = getReadingTime(page.body)
    const estimateMinutes = Math.ceil(readingTime.minutes);

    const svg = await satori(
        {
            type: "div",
            props: {
                children: [
                    {
                        type: "h1",
                        props: {
                            children: page.data.title,
                            style: {
                                fontFamily: "Open Sans",
                                fontSize: "64px",
                                lineHeight: 1,
                                color: "#111",
                                marginBottom: "32px",
                            },
                        }
                    },
                    {
                        type: "p",
                        props: {
                            children: `${formatDate(page.data.publishedAt)} | dadyarri | Читать ${estimateMinutes} минут`,
                            style: {
                                fontFamily: "Open Sans",
                                fontSize: "32px",
                                lineHeight: 1,
                                color: "#444",
                            },
                        }
                    },
                    {
                        type: "div",
                        props: {
                            style: {
                                display: "flex",
                                alignItems: "baseline",
                                flexWrap: "wrap",
                                gap: "4px"
                            },
                            children: page.data.tags.map((tag) => {
                                return {
                                    type: "span",
                                    props: {
                                        children: tag,
                                        style: {
                                            backgroundColor: "rgb(245,245,245)",
                                            borderRadius: "6px",
                                            padding: "4px",
                                            marginLeft: "4px",
                                            marginRight: "4px",
                                            fontSize: "24px"
                                        }
                                    }
                                }
                            })
                        }
                    }
                ],
                style: {
                    width: 1200,
                    height: 630,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    borderBottom: "20px solid rgb(53, 88, 255)",
                    padding: "80px",
                    background: "#fff"
                },
            }
        },
        {
            width: 1200,
            height: 630,
            fonts: [
                {
                    name: "Open Sans",
                    data: openSansData,
                    weight: 400,
                    style: "normal",
                },
                {
                    name: "Open Sans",
                    data: openSansData,
                    weight: 600,
                    style: "normal",
                },
            ],
        }
    );

    const png = await sharp(Buffer.from(svg)).png().toBuffer();

    return new Response(png, {
        headers: {
            "Content-Type": "image/png",
        },
    });
}