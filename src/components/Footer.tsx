
export default function Footer() {
    return (
        <footer className="w-full py-6 text-center mt-auto">
            <div className="container mx-auto px-4 flex flex-col items-center justify-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                    TechGadget Manager <span className="text-primary/70">Horizon</span>
                </p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 font-mono">
                    <span>v1.0.0</span>
                    <span>•</span>
                    <span>© 2026 Dương Cầm</span>
                </div>
            </div>
        </footer>
    );
}
