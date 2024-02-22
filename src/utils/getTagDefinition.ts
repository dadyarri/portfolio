import type { Tag, AllowedId } from "@/data/tags";
import tags from "@/data/tags";

export default function getTagDefinition(tag: AllowedId): Tag {
    return tags.find(t => t.id == tag)!;
}