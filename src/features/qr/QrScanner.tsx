"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X, QrCode, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { useRouter } from "next/navigation";

interface QrScannerProps {
    onScan?: (result: string) => void;
    onClose?: () => void;
}

export function QrScanner({ onScan, onClose }: QrScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const startScanner = async () => {
        if (!containerRef.current) return;

        setError(null);
        setIsScanning(true);

        try {
            const scanner = new Html5Qrcode("qr-reader");
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    // Success callback
                    handleScanSuccess(decodedText);
                },
                () => {
                    // Error callback (ignore - continuous scanning)
                }
            );
        } catch (err: unknown) {
            console.error("Scanner error:", err);
            setIsScanning(false);
            if (String(err).includes("Permission")) {
                setError("Vui lòng cho phép truy cập camera để quét QR");
            } else {
                setError("Không thể khởi động camera. Vui lòng thử lại.");
            }
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (err) {
                console.error("Error stopping scanner:", err);
            }
            scannerRef.current = null;
        }
        setIsScanning(false);
    };

    const handleScanSuccess = async (decodedText: string) => {
        await stopScanner();

        // Check if it's a valid item ID (UUID format)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (onScan) {
            onScan(decodedText);
        } else if (uuidRegex.test(decodedText)) {
            // Navigate to item detail
            router.push(`/?item=${decodedText}`);
            onClose?.();
        } else if (decodedText.startsWith("http")) {
            // It's a URL, extract item ID if possible
            try {
                const url = new URL(decodedText);
                const itemIdParam = url.searchParams.get("item");

                // Case 1: Query Param (?item=...)
                if (itemIdParam) {
                    router.push(`/?item=${itemIdParam}`);
                    onClose?.();
                    return;
                }

                // Case 2: Path URL (/items/...)
                const pathMatch = url.pathname.match(/\/items\/([a-zA-Z0-9-]+)/);
                if (pathMatch && pathMatch[1]) {
                    router.push(`/?item=${pathMatch[1]}`);
                    onClose?.();
                    return;
                }
            } catch {
                // Not a valid URL
            }
        }
    };

    useEffect(() => {
        // Start scanner on mount
        const initScanner = async () => {
            await startScanner();
        };
        initScanner();
        return () => {
            stopScanner();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/50">
                <div className="flex items-center gap-2 text-white">
                    <QrCode className="h-5 w-5" />
                    <span className="font-medium">Quét mã QR</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        stopScanner();
                        onClose?.();
                    }}
                    className="text-white hover:bg-white/20 rounded-full"
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Scanner Area */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="relative w-full max-w-sm aspect-square">
                    {/* QR Reader Container */}
                    <div
                        id="qr-reader"
                        ref={containerRef}
                        className="w-full h-full rounded-2xl overflow-hidden"
                    />

                    {/* Scanning Frame Overlay */}
                    {isScanning && (
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-0 border-2 border-white/30 rounded-2xl" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px]">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-500 rounded-tl-lg" />
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-500 rounded-tr-lg" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-500 rounded-bl-lg" />
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-500 rounded-br-lg" />
                                {/* Scanning Line Animation */}
                                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary-500 to-transparent animate-[scan_2s_ease-in-out_infinite]" />
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {!isScanning && !error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-2xl">
                            <div className="text-center text-white">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                <p className="text-sm">Đang khởi động camera...</p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-2xl">
                            <div className="text-center text-white p-6">
                                <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-sm mb-4">{error}</p>
                                <Button onClick={startScanner} variant="outline" className="text-white border-white hover:bg-white/20">
                                    Thử lại
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Instructions */}
            <div className="p-6 text-center text-white/70 text-sm">
                <p>Đưa mã QR vào khung hình để quét</p>
                <p className="text-xs mt-1 opacity-60">Hỗ trợ QR từ ứng dụng TechGadget Manager</p>
            </div>
        </div>
    );
}

// Modal Trigger Button Component
export function QrScannerButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(true)}
                className="rounded-full hover:bg-primary-50"
                title="Quét QR"
            >
                <QrCode className="h-5 w-5 text-gray-600" />
            </Button>

            {isOpen && <QrScanner onClose={() => setIsOpen(false)} />}
        </>
    );
}
