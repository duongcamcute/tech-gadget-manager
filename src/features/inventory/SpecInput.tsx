import { useState, useRef } from "react";
import { Button, Input } from "@/components/ui/primitives";
import { Plus } from "lucide-react";

interface SpecInputProps {
    onAdd: (key: string, value: string) => void;
    placeholderKey?: string;
    placeholderValue?: string;
}

export function SpecInput({ onAdd, placeholderKey = "Tên (VD: Năm SX)", placeholderValue = "Giá trị..." }: SpecInputProps) {
    const [key, setKey] = useState("");
    const [val, setVal] = useState("");
    const [error, setError] = useState(false);
    const keyRef = useRef<HTMLInputElement>(null);

    const handleAdd = () => {
        console.log("SpecInput: handleAdd called. Key:", key, "Value:", val);
        if (key.trim()) {
            onAdd(key.trim(), val.trim());
            setKey("");
            setVal("");
            setError(false);
            keyRef.current?.focus();
        } else {
            console.log("SpecInput: Key is empty");
            setError(true);
            keyRef.current?.focus();
        }
    };

    return (
        <div className="flex gap-2 items-center pt-2 border-t border-dashed border-gray-200">
            <Input
                ref={keyRef}
                value={key}
                onChange={(e) => {
                    setKey(e.target.value);
                    if (e.target.value) setError(false);
                }}
                placeholder={placeholderKey}
                className={`h-8 text-xs w-1/3 bg-white ${error ? "border-red-500 ring-1 ring-red-500" : ""}`}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAdd();
                    }
                }}
            />
            <Input
                value={val}
                onChange={(e) => setVal(e.target.value)}
                placeholder={placeholderValue}
                className="h-8 text-xs flex-1 bg-white"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAdd();
                    }
                }}
            />
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 border-dashed border-green-300 text-green-600 hover:bg-green-50 hover:border-green-500"
                onClick={handleAdd}
            >
                <Plus size={14} />
            </Button>
        </div>
    );
}
