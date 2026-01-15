import { z } from "zod";

export const ItemSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Tên thiết bị là bắt buộc"),
    type: z.string().optional(), // Relaxed for form init
    category: z.string().optional(), // Relaxed

    // New Rich Fields
    brand: z.string().nullable().optional().or(z.literal('')),
    model: z.string().nullable().optional().or(z.literal('')),
    color: z.string().nullable().optional().or(z.literal('')),
    serialNumber: z.string().nullable().optional().or(z.literal('')),

    specs: z.record(z.string(), z.any()).optional(), // Changed from any to record for safer JSON handling

    locationId: z.string().optional().nullable().or(z.literal('')),

    status: z.string().default("Available"), // Available, InUse, Lent, Lost

    // Lending Context
    borrowerName: z.string().optional().or(z.literal('')),
    dueDate: z.string().optional().nullable().or(z.literal('')),
    borrowDate: z.string().optional().nullable().or(z.literal('')),

    purchasePrice: z.union([z.string(), z.number(), z.null(), z.literal('')]).optional(),
    purchaseDate: z.union([z.string(), z.date(), z.null(), z.literal('')]).optional(),
    warrantyEnd: z.union([z.string(), z.date(), z.null(), z.literal('')]).optional(),
    purchaseLocation: z.string().nullable().optional().or(z.literal('')),
    purchaseUrl: z.string().nullable().optional().or(z.literal('')),
    notes: z.string().nullable().optional().or(z.literal('')),
    image: z.string().nullable().optional().or(z.literal('')), // Base64 or URL
});

export type ItemFormData = z.infer<typeof ItemSchema>;

export const TemplateSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Tên mẫu là bắt buộc"),
    category: z.string().optional(),
    config: z.string(), // JSON string
});

export type TemplateData = z.infer<typeof TemplateSchema>;
