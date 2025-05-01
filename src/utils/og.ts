import type { PageMetadata, Paths } from "../types/metadata";
import satori from "satori";
import path from "path";
import { readFile, writeFile } from "fs/promises";
import { formatDate } from "./date";
import { Resvg } from "@resvg/resvg-js";

export async function generateOgImage(postMetaInfo: PageMetadata, paths: Paths) {

    const jbFontPath = path.join(paths.fonts, "jetbrains-mono.ttf");
    const rubikFontPath = path.join(paths.fonts, "rubik-bold.ttf");

    const jbFont = await readFile(jbFontPath);
    const rubikFont = await readFile(rubikFontPath);

    const svg = await satori({
        type: "div",
        props: {
            style: {
                width: "1200px",
                height: "630px",
                display: "flex",
                flexDirection: "column",
                alignItems: 'flex-start',
                justifyContent: 'center',
                position: "relative",
                backgroundColor: '#222436',
                padding: "30px",
            },
            children: [
                {
                    type: 'h1',
                    props: {
                        style: {
                            color: '#c8d3f5',
                            fontSize: '64px',
                            zIndex: 3,
                            fontFamily: "rubik"
                        },
                        children: postMetaInfo.title,
                    }
                },
                {
                    type: 'span',
                    props: {
                        style: {
                            color: '#B2C1F1',
                            fontSize: '48px',
                            zIndex: 3,
                            fontFamily: "jb-mono"
                        },
                        children: formatDate(postMetaInfo.date),
                    }
                }
            ]
        }
    }, {
        width: 1200,
        height: 630,
        fonts: [
            {
                name: "jb-mono",
                data: jbFont,
                weight: 400,
                style: "normal"
            },
            {
                name: "rubik",
                data: rubikFont,
                weight: 700,
                style: "normal"
            }
        ]
    });

    const opts = {
        font: {
            loadSystemFonts: false
        },
    }
    const resvg = new Resvg(svg, opts)
    const pngData = resvg.render()
    const buf = pngData.asPng()

    await writeFile(paths.output, buf);
}