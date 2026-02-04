import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface LocationNode {
    id: string;
    name: string;
    parentId?: string | null;
    children?: LocationNode[];
    level?: number;
    [key: string]: unknown; // Allow extra properties
}

export function buildLocationTree(locations: LocationNode[]): LocationNode[] {
    if (!locations || locations.length === 0) return [];

    // Map of ID to Node
    const map = new Map<string, LocationNode>();
    // Copy to avoid mutation and init children
    locations.forEach(loc => {
        map.set(loc.id, { ...loc, children: [] });
    });

    const roots: LocationNode[] = [];

    locations.forEach(original => {
        const node = map.get(original.id);
        if (original.parentId && map.has(original.parentId)) {
            map.get(original.parentId)!.children!.push(node!);
        } else {
            roots.push(node!);
        }
    });

    // Traverse and flatten
    const flat: LocationNode[] = [];
    const traverse = (nodes: LocationNode[], level = 0) => {
        nodes.forEach(node => {
            flat.push({ ...node, level });
            if (node.children && node.children.length > 0) traverse(node.children, level + 1);
        });
    };

    traverse(roots);
    return flat;
}
