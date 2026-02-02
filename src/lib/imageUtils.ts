/**
 * Image optimization utilities for client-side processing
 * Resize and convert images to WebP format before upload
 */

export interface ImageOptimizeOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0-1, default 0.8
}

const DEFAULT_OPTIONS: Required<ImageOptimizeOptions> = {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.8,
};

/**
 * Optimize an image file by resizing and converting to WebP
 * @param file - The image file to optimize
 * @param options - Optional settings for max dimensions and quality
 * @returns Promise<string> - Base64 data URL of the optimized image
 */
export async function optimizeImage(
    file: File,
    options?: ImageOptimizeOptions
): Promise<string> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    return new Promise((resolve, reject) => {
        // Create image element to load the file
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url); // Clean up

            // Calculate new dimensions maintaining aspect ratio
            let { width, height } = img;

            if (width > opts.maxWidth || height > opts.maxHeight) {
                const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            // Create canvas and draw resized image
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }

            // Use high quality rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to WebP (fallback to JPEG if WebP not supported)
            let dataUrl: string;
            try {
                dataUrl = canvas.toDataURL("image/webp", opts.quality);
                // Check if browser actually supports WebP
                if (!dataUrl.startsWith("data:image/webp")) {
                    dataUrl = canvas.toDataURL("image/jpeg", opts.quality);
                }
            } catch {
                dataUrl = canvas.toDataURL("image/jpeg", opts.quality);
            }

            resolve(dataUrl);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load image"));
        };

        img.src = url;
    });
}

/**
 * Get file size from base64 string (approximate)
 * @param base64 - Base64 data URL
 * @returns Size in bytes
 */
export function getBase64Size(base64: string): number {
    // Remove data URL prefix
    const base64String = base64.split(",")[1] || base64;
    // Base64 encodes 3 bytes in 4 chars, so multiply by 3/4
    return Math.round((base64String.length * 3) / 4);
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
