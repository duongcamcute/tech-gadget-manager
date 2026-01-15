import { ItemFormData } from "@/types/schema";

export interface SpecTemplate {
    label: string;
    category: string; // Grouping (e.g., "USB Standards")
    apply: (variant?: string) => Partial<ItemFormData>;
    variants?: { label: string; value: string; specs: Record<string, any> }[];
}

export const SPEC_TEMPLATES: SpecTemplate[] = [
    {
        label: "USB4 Cable",
        category: "Cables",
        apply: () => ({
            type: "Cable",
            category: "Data",
            name: "USB4 Cable",
            specs: {
                interface: "USB-C",
                standard: "USB4",
            },
        }),
        variants: [
            {
                label: "USB4 20Gbps (Gen 2x2)",
                value: "20gbps",
                specs: { bandwidth: "20Gbps", power: "60W" }, // Default power
            },
            {
                label: "USB4 40Gbps (Gen 3x2)",
                value: "40gbps",
                specs: { bandwidth: "40Gbps", power: "100W" },
            },
            {
                label: "USB4 80Gbps (Version 2.0)",
                value: "80gbps",
                specs: { bandwidth: "80Gbps", power: "240W" },
            },
        ],
    },
    {
        label: "Thunderbolt 4 Cable",
        category: "Cables",
        apply: () => ({
            type: "Cable",
            category: "Data",
            name: "Thunderbolt 4 Cable",
            specs: {
                interface: "USB-C",
                standard: "Thunderbolt 4",
                bandwidth: "40Gbps",
                power: "100W",
                length: "0.8m", // Standard passive length
            },
        }),
    },
    {
        label: "GaN Charger",
        category: "Chargers",
        apply: () => ({
            type: "Charger",
            category: "Charging",
            name: "GaN Charger",
            specs: {
                technology: "GaN",
            },
        }),
        variants: [
            { label: "65W (2C1A)", value: "65w_2c1a", specs: { power: "65W", ports: "2x USB-C, 1x USB-A" } },
            { label: "100W (3C1A)", value: "100w_3c1a", specs: { power: "100W", ports: "3x USB-C, 1x USB-A" } },
            { label: "140W (MacBook Pro)", value: "140w", specs: { power: "140W", ports: "3x USB-C" } },
        ],
    },
];
