import type { Tag } from "@/data/tags";
import tags from "@/data/tags";

export default function getTagDefinition(tag: string): Tag {
    const defaultTag: Tag = {
        label: tag,
        id: "default"
    }
    return tags.find(t => t.id == tag) ?? defaultTag;
}