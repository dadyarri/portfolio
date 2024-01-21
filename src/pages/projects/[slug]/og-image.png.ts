import fs from "fs/promises";
import type { APIRoute } from "astro";
import { getCollection, getEntryBySlug } from "astro:content";
import satori from "satori";
import sharp from "sharp";
import formatDate from "@/utils/formatDate";
import getReadingTime from 'reading-time';
import { declensionOfMinutes } from "@/utils/declensionOfNumerals";
import getTagDefinition from "@/utils/getTagDefinition";

export async function getStaticPaths() {
    const projects = await getCollection("projects");
    return projects.map((project) => ({
        params: { slug: project.slug },
        props: project,
    }));
}

export const GET: APIRoute = async ({ params }) => {
    const page = (await getEntryBySlug("projects", params.slug!))!;
    const nunitoSansData = await fs.readFile("./public/fonts/NunitoSans-Regular.ttf");
    const montserratData = await fs.readFile("./public/fonts/Montserrat-Bold.ttf");
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
                                fontFamily: "Montserrat",
                                fontSize: "64px",
                                lineHeight: 1,
                                color: "#000",
                                marginBottom: "0px",
                            },
                        }
                    },
                    {
                        type: "p",
                        props: {
                            children: page.data.description,
                            style: {
                                fontFamily: "Nunito Sans",
                                fontSize: "32px",
                                lineHeight: 1,
                                color: "#111",
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
                                const tagDef = getTagDefinition(tag);
                                return {
                                    type: "div",
                                    props: {
                                        children: tagDef.label,
                                        style: {
                                            backgroundColor: "#f5f5f5",
                                            borderRadius: "6px",
                                            padding: "8px",
                                            marginLeft: "4px",
                                            marginRight: "4px",
                                            fontSize: "24px",
                                            fontFamily: "Nunito Sans",
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
                    borderBottom: "20px solid #3b82f6",
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
                    name: "Nunito Sans",
                    data: nunitoSansData,
                    weight: 400,
                    style: "normal",
                },
                {
                    name: "Montserrat",
                    data: montserratData,
                    weight: 700,
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