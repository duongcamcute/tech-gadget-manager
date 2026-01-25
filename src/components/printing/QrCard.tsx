import React from "react";
import { QRCodeSVG } from "qrcode.react";

export interface ItemForPrint {
    id: string;
    name: string;
    type: string;
    category: string;
    brand?: string;
    model?: string;
    color?: string;
}

export const QrCard = ({ item, simpleMode = false }: { item: ItemForPrint, simpleMode?: boolean }) => {
    // Standard styles for export to bypass html2canvas issues with Tailwind/CSS vars
    const exportStyle = simpleMode ? {
        container: {
            width: '300px',
            height: '350px',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            border: '2px dashed #000000',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'Arial, sans-serif',
            position: 'relative' as const,
            zIndex: 1
        },
        header: { textAlign: 'center' as const, width: '100%', zIndex: 10 },
        title: { fontSize: '24px', fontWeight: 'bold', color: '#000000', margin: '0 0 8px 0', lineHeight: 1.1 },
        subtitle: { fontSize: '12px', fontWeight: 'bold', color: '#666666', textTransform: 'uppercase' as const, letterSpacing: '2px' },
        qrContainer: { padding: '16px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #eeeeee' },
        footer: { textAlign: 'center' as const, width: '100%', zIndex: 10 },
        idBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: '4px', backgroundColor: '#f0f0f0', color: '#333333', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' },
        brand: { marginTop: '8px', fontSize: '10px', fontWeight: 'bold', color: '#999999', textTransform: 'uppercase' as const, letterSpacing: '2px' }
    } : {};

    if (simpleMode) {
        return (
            <div id={`qr-card-${item.id}`} style={exportStyle.container}>
                <div style={exportStyle.header}>
                    <h2 style={exportStyle.title}>{item.name}</h2>
                    <div style={exportStyle.subtitle}>
                        {item.type} • {item.category}
                    </div>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                    <div style={exportStyle.qrContainer}>
                        <QRCodeSVG
                            value={`${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')}/items/${item.id}`}
                            size={160}
                            level="H"
                            includeMargin={false}
                        />
                    </div>
                </div>
                <div style={exportStyle.footer}>
                    <div style={exportStyle.idBadge}>#{item.id.slice(0, 8).toUpperCase()}</div>
                    {item.brand && <div style={exportStyle.brand}>{item.brand} {item.model}</div>}
                </div>
                <div style={{ position: 'absolute', inset: 0, backgroundColor: '#ffffff', zIndex: -10 }} />
            </div>
        );
    }

    return (
        <div
            id={`qr-card-${item.id}`}
            className="w-[300px] h-[350px] bg-white rounded-3xl border-2 border-dashed border-gray-800 p-6 flex flex-col items-center justify-between shadow-sm relative overflow-hidden"
            style={{ fontFamily: 'system-ui, sans-serif' }}
        >
            {/* Header */}
            <div className="text-center w-full z-10">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2 line-clamp-2">
                    {item.name}
                </h2>
                <div className="flex items-center justify-center gap-2 text-xs font-bold tracking-widest uppercase text-slate-500">
                    <span>{item.type}</span>
                    <span>•</span>
                    <span>{item.category}</span>
                </div>
            </div>

            {/* QR Code Area */}
            <div className="flex-1 flex items-center justify-center w-full py-4 z-10">
                <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                    <QRCodeSVG
                        value={`${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')}/items/${item.id}`}
                        size={160}
                        level="H"
                        includeMargin={false}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="w-full text-center z-10">
                <div className="inline-block px-3 py-1 rounded bg-slate-100 font-mono text-xs font-bold text-slate-600 tracking-wider">
                    #{item.id.slice(0, 8).toUpperCase()}
                </div>
                {item.brand && (
                    <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {item.brand} {item.model}
                    </div>
                )}
            </div>

            {/* Decoration Background */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-slate-50 rounded-full mix-blend-multiply filter blur-2xl opacity-70"></div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-slate-50 rounded-full mix-blend-multiply filter blur-2xl opacity-70"></div>
        </div>
    );
};
