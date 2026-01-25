import { QRCodeGenerator } from "@/features/qr/QRCodeGenerator";
import { getItem } from "../../actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

// Fix: params is a Promise in Next.js 15+
export default async function ItemQRPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const item = await getItem(resolvedParams.id);

    if (!item) {
        notFound();
    }

    // URL for QR: Prefer Env Var (Public URL), fallback to localhost implies internal usage mostly
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const qrValue = `${appUrl}/items/${item.id}`;

    return (
        <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="flex justify-between items-center no-print">
                    <Link href="/" className="text-sm flex items-center hover:text-primary transition-colors text-muted-foreground font-medium">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
                    </Link>
                    <div className="print-btn-placeholder">
                        {/* Placeholder for print button action */}
                        <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded border shadow-sm">Ctrl + P để in</span>
                    </div>
                </div>

                <div className="border bg-card rounded-2xl shadow-xl p-8 text-center space-y-6 print:shadow-none print:border-none">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">{item.name}</h1>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{item.type} • {item.category}</p>
                    </div>

                    <div className="flex justify-center p-4 bg-white rounded-xl border-2 border-dashed border-muted mx-auto w-fit">
                        <QRCodeGenerator value={qrValue} size={180} />
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{item.location ? item.location.name : 'Chưa định vị'}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/50 font-mono">{item.id}</p>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                @media print {
                    .no-print { display: none !important; }
                    body { background: white; }
                    .bg-secondary\\/30 { background: none; }
                    .shadow-xl { box-shadow: none; }
                    .min-h-screen { min-height: auto; display: block; }
                }
            `}} />
            </div>
        </div>
    );
}
