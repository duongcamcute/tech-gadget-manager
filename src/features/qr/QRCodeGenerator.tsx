"use client";

import { QRCodeSVG } from "qrcode.react";

export function QRCodeGenerator({ value, size = 128 }: { value: string; size?: number }) {
    return (
        <div className="bg-white p-2 rounded-lg shadow-sm inline-block">
            <QRCodeSVG value={value} size={size} />
        </div>
    );
}
