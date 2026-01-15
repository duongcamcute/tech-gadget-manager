"use client";

import * as React from "react"
import { cn } from "@/lib/utils"

// --- Context Definition for Tabs ---
type TabsContextValue = {
    activeTab: string;
    setActiveTab: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

function useTabs() {
    const context = React.useContext(TabsContext);
    if (!context) {
        throw new Error("Tabs components must be used within a Tabs provider");
    }
    return context;
}

// --- Components ---

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'destructive';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-95 duration-100",
                    // Variants
                    variant === 'default' && "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20",
                    variant === 'destructive' && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                    variant === 'outline' && "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                    variant === 'ghost' && "hover:bg-accent hover:text-accent-foreground",
                    // Sizes
                    size === 'default' && "h-10 px-4 py-2",
                    size === 'sm' && "h-9 rounded-md px-3",
                    size === 'lg' && "h-11 rounded-md px-8",
                    size === 'icon' && "h-10 w-10",
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-lg border border-input bg-white/50 backdrop-blur-sm px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
    ({ className, ...props }, ref) => (
        <label
            ref={ref}
            className={cn(
                "text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground/80",
                className
            )}
            {...props}
        />
    )
)
Label.displayName = "Label"

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
    ({ className, ...props }, ref) => (
        <div className="relative">
            <select
                ref={ref}
                className={cn(
                    "flex h-10 w-full appearance-none items-center justify-between rounded-lg border border-input bg-white/50 backdrop-blur-sm px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
                    className
                )}
                {...props}
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"><path d="M4.93179 5.43179C4.75605 5.25605 4.75605 4.97113 4.93179 4.79539C5.10753 4.61965 5.39245 4.61965 5.56819 4.79539L7.49999 6.72718L9.43179 4.79539C9.60753 4.61965 9.89245 4.61965 10.0682 4.79539C10.2439 4.97113 10.2439 5.25605 10.0682 5.43179L7.81819 7.68179C7.73379 7.76619 7.61933 7.8136 7.49999 7.8136C7.38064 7.8136 7.26618 7.76619 7.18179 7.68179L4.93179 5.43179ZM10.0682 9.56819C10.2439 9.74393 10.2439 10.0288 10.0682 10.2046C9.89245 10.3803 9.60753 10.3803 9.43179 10.2046L7.49999 8.27278L5.56819 10.2046C5.39245 10.3803 5.10753 10.3803 4.93179 10.2046C4.75605 10.0288 4.75605 9.74393 4.93179 9.56819L7.18179 7.31819C7.26618 7.23379 7.38064 7.18638 7.49999 7.18638C7.61933 7.18638 7.73379 7.23379 7.81819 7.31819L10.0682 9.56819Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
            </div>
        </div>
    )
)
Select.displayName = "Select"

// Card Components
export function Card({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow duration-300", className)}>
            {children}
        </div>
    );
}

export function CardHeader({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("flex flex-col space-y-1.5 p-6", className)}>{children}</div>;
}

export function CardTitle({ className, children }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h3 className={cn("font-semibold leading-none tracking-tight", className)}>{children}</h3>;
}

export function CardContent({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("p-6 pt-0", className)}>{children}</div>;
}

// Tabs Components - Using Context API (Robust)
export const Tabs = ({ children, defaultValue, className }: { children: React.ReactNode, defaultValue: string, className?: string }) => {
    const [activeTab, setActiveTab] = React.useState(defaultValue);

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div className={className} data-active-tab={activeTab}>
                {children}
            </div>
        </TabsContext.Provider>
    )
}

export const TabsList = ({ children, className }: any) => {
    return (
        <div className={cn("inline-flex h-11 items-center justify-center rounded-xl bg-muted/80 p-1 text-muted-foreground", className)}>
            {children}
        </div>
    )
}

export const TabsTrigger = ({ value, children, className }: any) => {
    const { activeTab, setActiveTab } = useTabs();
    const isActive = activeTab === value;

    return (
        <button
            type="button"
            className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1", isActive ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50 hover:text-foreground", className)}
            onClick={() => setActiveTab(value)}
        >
            {children}
        </button>
    )
}

export const TabsContent = ({ value, children, className }: any) => {
    const { activeTab } = useTabs();
    const isActive = value === activeTab;

    // Using hidden to preserve state
    return (
        <div
            className={cn("mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", !isActive && "hidden", className)}
            data-state={isActive ? "active" : "inactive"}
        >
            {children}
        </div>
    )
}
