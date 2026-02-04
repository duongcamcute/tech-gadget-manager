
"use client";

import { useState, useEffect, useCallback } from "react";
import * as React from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { updateUserProfile, saveThemeSettings, addBrandAction, getBrands, createTemplate, deleteTemplate, getTemplates, exportDatabase, importDatabase, generateApiKey, revokeApiKey, getApiKeys, getItemTypes, createItemType, deleteItemType } from "@/app/actions";
import { ITEM_TYPES } from "@/lib/constants/options";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { Loader2, Save, Plus, ArrowLeft, Trash2, LayoutGrid, Palette, User, ShieldCheck, Home, Server, Key, Download, Upload, Copy, Database, History } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuditLogViewer } from "@/features/audit/AuditLogViewer";

// --- Item Type Manager Component ---
function ItemTypeManager() {
    const { toast } = useToast();
    const [itemTypes, setItemTypes] = useState<{ id: string; value: string; label: string }[]>([]);
    const [newValue, setNewValue] = useState("");
    const [newLabel, setNewLabel] = useState("");
    const [loading, setLoading] = useState(false);

    const loadItemTypes = useCallback(async () => {
        try {
            const res = await getItemTypes();
            setItemTypes(res);
        } catch {
            // Silently ignore errors
        }
    }, []);

    useEffect(() => {
        loadItemTypes();
    }, [loadItemTypes]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newValue || !newLabel) return;
        setLoading(true);
        const res = await createItemType(newValue, newLabel);
        if (res.success) {
            toast(`Đã thêm loại "${newLabel}"`, "success");
            setNewValue("");
            setNewLabel("");
            loadItemTypes();
        } else {
            toast(res.error || "Lỗi", "error");
        }
        setLoading(false);
    };

    const handleDelete = async (id: string, label: string) => {
        if (!confirm(`Xác nhận xóa loại "${label}"?`)) return;
        setLoading(true);
        const res = await deleteItemType(id);
        if (res.success) {
            toast("Đã xóa", "success");
            loadItemTypes();
        } else {
            toast(res.error || "Lỗi xóa", "error");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-4 mt-3">
            <form onSubmit={handleAdd} className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                    <Label className="text-xs font-bold text-gray-700">Mã loại (value)</Label>
                    <Input
                        placeholder="VD: Drone, SmartTV..."
                        value={newValue}
                        onChange={e => setNewValue(e.target.value)}
                        className="h-9 bg-white"
                    />
                </div>
                <div className="flex-1 space-y-1">
                    <Label className="text-xs font-bold text-gray-700">Tên hiển thị (label)</Label>
                    <Input
                        placeholder="VD: Drone / Flycam..."
                        value={newLabel}
                        onChange={e => setNewLabel(e.target.value)}
                        className="h-9 bg-white"
                    />
                </div>
                <Button type="submit" disabled={!newValue || !newLabel || loading} className="shrink-0 h-9">
                    <Plus className="mr-1 h-3.5 w-3.5" /> Thêm
                </Button>
            </form>

            <div className="pt-3 border-t border-gray-200">
                <Label className="text-xs uppercase font-bold text-gray-500 mb-2 block">Loại tùy chỉnh của bạn</Label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                    {itemTypes.map((t: { id: string; value: string; label: string }) => (
                        <div key={t.id} className="group flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded-md text-sm shadow-sm hover:border-green-300 transition-colors">
                            <span className="font-medium">{t.label}</span>
                            <span className="text-[10px] text-gray-400 font-mono">({t.value})</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(t.id, t.label)}
                                className="h-5 w-5 p-0 ml-1 text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                    {itemTypes.length === 0 && <span className="text-sm text-gray-400 italic">Chưa có loại tùy chỉnh nào. Thêm mới ở trên!</span>}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">💡 Tip: Các loại mặc định (Cable, Charger, Laptop...) vẫn được giữ nguyên. Loại tùy chỉnh sẽ bổ sung thêm vào danh sách.</p>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const { user, updateUser } = useAuthStore();
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Account State
    const [newUsername, setNewUsername] = useState(user?.username || "");
    const [newFullName, setNewFullName] = useState(user?.fullName || "");
    const [newPass, setNewPass] = useState("");
    const [newAvatar, setNewAvatar] = useState(user?.avatar || "");

    // Theme State
    const [primaryColor, setPrimaryColor] = useState(
        user?.colors ? JSON.parse(user.colors)['--primary-dynamic'] || '#ea580c' : '#ea580c'
    );

    // Brand State
    const [brandName, setBrandName] = useState("");
    const [brandsList, setBrandsList] = useState<{ id: string; name: string }[]>([]);

    // API & System State
    const [apiKeys, setApiKeys] = useState<{ id: string; name: string; key: string; createdAt: Date; lastUsed: Date | null }[]>([]);
    const [newKeyName, setNewKeyName] = useState("");
    const [importFile, setImportFile] = useState<File | null>(null);
    const [clearBeforeImport, setClearBeforeImport] = useState(false);

    const loadBrands = useCallback(async () => {
        try {
            const res = await getBrands();
            setBrandsList(res);
        } catch { }
    }, []);

    const loadApiKeys = useCallback(async () => {
        try {
            const res = await getApiKeys();
            setApiKeys(res);
        } catch { }
    }, []);

    useEffect(() => {
        loadBrands();
        loadApiKeys();
    }, [loadBrands, loadApiKeys]);

    // ... inside component

    // Template State
    const [templates, setTemplates] = useState<{ id: string; name: string; config: string }[]>([]);
    const [newTemplateName, setNewTemplateName] = useState("");
    // Visual Editor State
    const [tempType, setTempType] = useState(ITEM_TYPES[0].value);
    const [tempBrand, setTempBrand] = useState("");
    const [tempSpecs, setTempSpecs] = useState<{ key: string, value: string }[]>([{ key: "", value: "" }]);

    const loadTemplates = useCallback(async () => { // Wrapped with useCallback
        try {
            const res = await getTemplates();
            setTemplates(res);
        } catch { }
    }, []);

    useEffect(() => {
        loadTemplates();
    }, [loadTemplates]); // Added loadTemplates to dependency array

    const handleAddSpecRow = () => {
        setTempSpecs([...tempSpecs, { key: "", value: "" }]);
    };

    const handleRemoveSpecRow = (idx: number) => {
        const newSpecs = [...tempSpecs];
        newSpecs.splice(idx, 1);
        setTempSpecs(newSpecs);
    };

    const handleSpecChange = (idx: number, field: 'key' | 'value', val: string) => {
        const newSpecs = [...tempSpecs];
        newSpecs[idx][field] = val;
        setTempSpecs(newSpecs);
    };

    const handleCreateTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Construct Config
        const specsObj = tempSpecs.reduce((acc, curr) => {
            if (curr.key && curr.value) acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        const configObj = {
            type: tempType,
            brand: tempBrand,
            specs: specsObj
        };

        const configStr = JSON.stringify(configObj);

        const res = await createTemplate({ name: newTemplateName, category: "Custom", config: configStr });
        if (res.success) {
            toast(`Đã tạo mẫu ${newTemplateName}`, "success");
            setNewTemplateName("");
            setTempType(ITEM_TYPES[0].value);
            setTempBrand("");
            setTempSpecs([{ key: "", value: "" }]);
            loadTemplates();
        } else {
            toast(res.error || "Lỗi", "error");
        }
        setLoading(false);
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm("Xóa mẫu này?")) return;
        const res = await deleteTemplate(id);
        if (res.success) {
            toast("Đã xóa", "success");
            loadTemplates();
        } else {
            toast("Lỗi xóa", "error");
        }
    };

    {/* Template Management UI */ }
    <div className="space-y-4 p-5 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
        <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Quản lý Mẫu nhanh (Templates)</h4>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Visual Editor</span>
        </div>
        <p className="text-xs text-muted-foreground">Tạo mẫu để điền nhanh thông tin khi thêm mới.</p>

        <div className="space-y-3 mt-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Tên mẫu <span className="text-red-500">*</span></Label>
                <Input
                    placeholder="VD: Combo đi làm..."
                    value={newTemplateName}
                    onChange={e => setNewTemplateName(e.target.value)}
                    className="h-9"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label className="text-xs font-bold text-gray-700">Loại thiết bị</Label>
                    <select
                        value={tempType}
                        onChange={e => setTempType(e.target.value as any)}
                        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {ITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs font-bold text-gray-700">Hãng mặc định</Label>
                    <Input
                        placeholder="VD: Anker"
                        value={tempBrand}
                        onChange={e => setTempBrand(e.target.value)}
                        className="h-9"
                    />
                </div>
            </div>

            <div className="space-y-2 pt-2">
                <Label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                    <span>Thông số kỹ thuật mặc định</span>
                    <Button type="button" variant="ghost" size="sm" onClick={handleAddSpecRow} className="h-6 px-2 text-primary-600 hover:bg-primary-50">
                        <Plus className="w-3 h-3 mr-1" /> Thêm dòng
                    </Button>
                </Label>

                {tempSpecs.map((spec, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                        <Input
                            placeholder="Tên (VD: power)"
                            value={spec.key}
                            onChange={e => handleSpecChange(idx, 'key', e.target.value)}
                            className="h-8 text-xs flex-1"
                        />
                        <Input
                            placeholder="Giá trị (VD: 65W)"
                            value={spec.value}
                            onChange={e => handleSpecChange(idx, 'value', e.target.value)}
                            className="h-8 text-xs flex-1"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveSpecRow(idx)} className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                ))}
                {tempSpecs.length === 0 && <p className="text-[10px] text-gray-400 italic">Không có thông số đặc biệt.</p>}
            </div>

            <div className="pt-2 flex justify-end">
                <Button onClick={handleCreateTemplate} disabled={!newTemplateName || loading} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                    <Save className="mr-2 h-3.5 w-3.5" /> Lưu Mẫu Mới
                </Button>
            </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
            <Label className="text-xs uppercase font-bold text-gray-500 mb-3 block">Danh sách mẫu của bạn</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto p-1 custom-scrollbar">
                {templates.map((t: any) => {
                    let configDetails = "";
                    try {
                        const c = JSON.parse(t.config);
                        configDetails = `${c.type} • ${c.brand || 'No Brand'} • ${Object.keys(c.specs || {}).length} specs`;
                    } catch (e) { configDetails = t.config }

                    return (
                        <div key={t.id} className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2.5 rounded-xl text-sm shadow-sm hover:border-purple-300 transition-all hover:shadow-md group">
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors">{t.name}</span>
                                <span className="text-[10px] text-gray-500 font-mono mt-0.5">{configDetails}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(t.id)} className="h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    )
                })}
                {templates.length === 0 && <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200"><span className="text-sm text-gray-400 italic">Chưa có mẫu nào. Hãy tạo mới!</span></div>}
            </div>
        </div>
    </div>

    useEffect(() => {
        if (user) {
            setNewUsername(user.username);
            setNewFullName(user.fullName || "");
            setNewAvatar(user.avatar || "");
            if (user.colors) {
                try {
                    const c = JSON.parse(user.colors);
                    if (c['--primary-dynamic']) setPrimaryColor(c['--primary-dynamic']);
                } catch (e) { }
            }
        }
    }, [user]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        const res = await updateUserProfile(user.id, newUsername, newPass, newFullName, newAvatar);
        if (res.success) {
            updateUser({ username: newUsername, fullName: newFullName, ...res.user, avatar: res?.user?.avatar ?? undefined });
            toast("Cập nhật hồ sơ thành công", "success");
            setNewPass(""); // Clear password field
        } else {
            toast(res.error || "Lỗi", "error");
        }
        setLoading(false);
    };

    const handleSaveTheme = async () => {
        if (!user) return;
        setLoading(true);

        const colors = JSON.stringify({
            '--primary-dynamic': primaryColor,
        });

        const res = await saveThemeSettings(user.id, "custom", colors);
        if (res.success) {
            updateUser({ theme: "custom", colors });
            // Apply immediately
            document.documentElement.style.setProperty('--primary-dynamic', primaryColor);
            toast("Đã lưu giao diện", "success");
        } else {
            toast("Lỗi lưu giao diện", "error");
        }
        setLoading(false);
    };

    const handleAddBrand = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await addBrandAction(brandName);
        if (res.success) {
            toast(`Đã thêm hãng ${brandName}`, "success");
            setBrandName("");
            loadBrands(); // Reload list
        } else {
            toast(res.error || "Lỗi", "error");
        }
        setLoading(false);
    };

    const handleExport = async () => {
        setLoading(true);
        try {
            const { exportDatabase } = await import("@/app/actions");
            const res = await exportDatabase();

            if (res.success && res.data) {
                const blob = new Blob([res.data], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `tech-gadget-backup-${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                toast("Xuất dữ liệu thành công", "success");
            } else {
                toast(res.error || "Lỗi xuất dữ liệu", "error");
            }
        } catch (e) {
            toast("Lỗi hệ thống", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleExportFull = async () => {
        setLoading(true);
        toast("Đang nén dữ liệu và nhận file...", "info");
        try {
            const { exportFullDatabase } = await import("@/app/actions");
            const res = await exportFullDatabase();

            if (res.success && res.data) {
                // Decode Base64
                const byteCharacters = atob(res.data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: "application/zip" });

                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `tech-gadget-full-backup-${new Date().toISOString().slice(0, 10)}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                toast("Xuất ZIP đầy đủ thành công!", "success");
            } else {
                toast(res.error || "Lỗi nén dữ liệu", "error");
            }
        } catch (e) {
            toast("Lỗi hệ thống: " + (e as Error).message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!importFile) return;
        if (clearBeforeImport && !confirm("CẢNH BÁO: Dữ liệu hiện tại sẽ bị xóa hoàn toàn. Bạn có chắc chắn không?")) return;

        setLoading(true);
        toast("Đang xử lý nhập dữ liệu...", "info");

        try {
            const isZip = importFile.name.toLowerCase().endsWith(".zip");

            let res;
            if (isZip) {
                const reader = new FileReader();
                reader.readAsDataURL(importFile);
                await new Promise((resolve) => {
                    reader.onload = async () => {
                        try {
                            const base64 = (reader.result as string).split(',')[1];
                            const { importFullDatabase } = await import("@/app/actions");
                            res = await importFullDatabase(base64, clearBeforeImport);
                            resolve(true);
                        } catch (e) { resolve(false); }
                    }
                    reader.onerror = () => resolve(false);
                });
            } else {
                const text = await importFile.text();
                const { importDatabase } = await import("@/app/actions");
                res = await importDatabase(text, clearBeforeImport);
            }

            // @ts-ignore
            if (res && res.success) {
                toast("Nhập dữ liệu thành công! Đang tải lại...", "success");
                setTimeout(() => window.location.reload(), 1500);
            } else {
                // @ts-ignore
                toast(res?.error || "Lỗi nhập file", "error");
            }
        } catch (e) {
            toast("File không hợp lệ hoặc lỗi hệ thống", "error");
        } finally {
            setLoading(false);
            setImportFile(null);
        }
    };

    const handleGenerateKey = async () => {
        if (!newKeyName) return;
        setLoading(true);
        const res = await generateApiKey(newKeyName);
        if (res.success) {
            toast("Đã tạo khóa API", "success");
            setNewKeyName("");
            loadApiKeys();
        } else {
            toast(res.error || "Lỗi", "error");
        }
        setLoading(false);
    };

    const handleRevokeKey = async (id: string) => {
        if (!confirm("Xóa khóa này? Các ứng dụng đang dùng sẽ bị mất kết nối.")) return;
        setLoading(true);
        await revokeApiKey(id);
        loadApiKeys();
        setLoading(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast("Đã sao chép khóa", "success");
    };

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-20">
                <div className="container mx-auto px-4 h-16 flex items-center gap-4 max-w-4xl">
                    <Link href="/" className="inline-flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 -ml-2 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Cài đặt hệ thống</h1>
                    <div className="ml-auto">
                        <Link href="/" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
                            <Home className="w-4 h-4" /> Về trang chủ
                        </Link>
                    </div>
                </div>
            </div>

            <div className="container mx-auto p-4 md:p-8 max-w-4xl">
                <Tabs defaultValue="account" className="w-full flex flex-col md:flex-row gap-8 items-start">

                    {/* Sidebar Navigation */}
                    <TabsList className="flex flex-col w-full md:w-64 h-auto bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 gap-1 md:sticky md:top-24">
                        <TabsTrigger value="account" className="w-full justify-start gap-3 py-3 px-4 rounded-xl data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 transition-all">
                            <User className="w-4 h-4" /> Tài khoản
                        </TabsTrigger>
                        <TabsTrigger value="appearance" className="w-full justify-start gap-3 py-3 px-4 rounded-xl data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 transition-all">
                            <Palette className="w-4 h-4" /> Giao diện & Màu sắc
                        </TabsTrigger>
                        <TabsTrigger value="app" className="w-full justify-start gap-3 py-3 px-4 rounded-xl data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 transition-all">
                            <LayoutGrid className="w-4 h-4" /> Cấu hình ứng dụng
                        </TabsTrigger>
                        <TabsTrigger value="system" className="w-full justify-start gap-3 py-3 px-4 rounded-xl data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 transition-all">
                            <Server className="w-4 h-4" /> Hệ thống & API
                        </TabsTrigger>
                        <TabsTrigger value="audit" className="w-full justify-start gap-3 py-3 px-4 rounded-xl data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 transition-all">
                            <History className="w-4 h-4" /> Nhật ký hoạt động
                        </TabsTrigger>
                    </TabsList>

                    {/* Main Content Area */}
                    <div className="flex-1 w-full space-y-6">

                        {/* ACCOUNT SETTINGS */}
                        <TabsContent value="account" className="mt-0">
                            {/* ... kept existing ... */}
                            <Card className="border-none shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 rounded-2xl overflow-hidden">
                                <div className="h-32 bg-gradient-to-r from-orange-400 to-red-500 relative">
                                    <div className="absolute -bottom-10 left-8 h-24 w-24 bg-white rounded-full p-1 shadow-lg">
                                        <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-3xl font-bold text-gray-400">
                                            {newFullName ? newFullName.charAt(0).toUpperCase() : user?.username.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                                <CardHeader className="pt-12 px-8">
                                    <CardTitle className="text-xl">Hồ sơ cá nhân</CardTitle>
                                    <p className="text-sm text-muted-foreground">Quản lý thông tin hiển thị và bảo mật</p>
                                </CardHeader>
                                <CardContent className="px-8 pb-8">
                                    <form onSubmit={handleSaveProfile} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs uppercase font-bold text-gray-500">Ảnh đại diện</Label>
                                                    <div className="grid grid-cols-6 gap-2 max-h-[200px] overflow-y-auto p-1 noscrollbar">
                                                        {Array.from({ length: 18 }).map((_, i) => {
                                                            const seed = `${newUsername}_${i}`;
                                                            const url = `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    onClick={() => setNewAvatar(url)}
                                                                    className={`aspect-square rounded-xl border-2 cursor-pointer p-1 transition-all hover:scale-105 hover:shadow-md ${newAvatar === url ? 'border-primary-500 ring-2 ring-primary-100 bg-primary-50' : 'border-gray-100 bg-white hover:border-primary-200'}`}
                                                                >
                                                                    <img src={url} className="w-full h-full rounded-lg" alt={`Avatar option ${i + 1}`} />
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs uppercase font-bold text-gray-500">Tên hiển thị (Full Name)</Label>
                                                    <Input value={newFullName} onChange={e => setNewFullName(e.target.value)} placeholder="Nguyễn Văn A" className="h-10 border-gray-200 bg-gray-50/50" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs uppercase font-bold text-gray-500">Tên đăng nhập</Label>
                                                <Input value={newUsername} onChange={e => setNewUsername(e.target.value)} className="h-10 border-gray-200 bg-gray-50/50" />
                                            </div>
                                        </div>

                                        <div className="space-y-2 p-4 border border-primary-100 bg-primary-50/30 rounded-xl">
                                            <div className="flex items-center gap-2 text-primary-800 font-semibold mb-2">
                                                <ShieldCheck className="w-4 h-4" />
                                                <span className="text-sm">Bảo mật</span>
                                            </div>
                                            <Label className="text-xs uppercase font-bold text-gray-500">Mật khẩu mới</Label>
                                            <Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Để trống nếu không đổi" className="bg-white border-primary-200 focus:border-primary-500 transition-colors" />
                                            <p className="text-xs text-muted-foreground mt-1">Mật khẩu nên có ít nhất 6 ký tự.</p>
                                        </div>

                                        <div className="flex justify-end pt-2">
                                            <Button disabled={loading} className="bg-gray-900 hover:bg-black text-white px-8 rounded-xl shadow-lg shadow-gray-500/20 transition-transform active:scale-95">
                                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                <Save className="mr-2 h-4 w-4" /> Lưu thay đổi
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* APPEARANCE SETTINGS */}
                        <TabsContent value="appearance" className="mt-0">
                            {/* ... kept existing ... */}
                            <Card className="border-none shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 rounded-2xl">
                                <CardHeader className="px-8 pt-8">
                                    <CardTitle>Tùy chỉnh giao diện</CardTitle>
                                    <p className="text-sm text-muted-foreground">Cá nhân hóa trải nghiệm sử dụng của bạn</p>
                                </CardHeader>
                                <CardContent className="px-8 pb-8 space-y-8">
                                    <div className="space-y-4">
                                        <Label className="text-base font-semibold">Màu chủ đạo</Label>
                                        <div className="flex flex-wrap gap-3">
                                            {[
                                                { name: "Cam rực rỡ", color: "#ea580c" },
                                                { name: "Xanh biển", color: "#0ea5e9" },
                                                { name: "Đỏ đậm", color: "#ef4444" },
                                                { name: "Xanh lá", color: "#22c55e" },
                                                { name: "Tím mộng mơ", color: "#8b5cf6" },
                                                { name: "Hồng phấn", color: "#ec4899" },
                                            ].map(c => (
                                                <button
                                                    key={c.name}
                                                    type="button"
                                                    onClick={() => setPrimaryColor(c.color)}
                                                    className={`group relative w-12 h-12 rounded-full shadow-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 ${primaryColor === c.color ? 'ring-2 ring-gray-900 scale-110' : 'ring-transparent'}`}
                                                    style={{ backgroundColor: c.color }}
                                                    title={c.name}
                                                >
                                                    {primaryColor === c.color && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="w-2 h-2 bg-white rounded-full" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}

                                            <div className="relative">
                                                <Input
                                                    type="color"
                                                    value={primaryColor}
                                                    onChange={e => setPrimaryColor(e.target.value)}
                                                    className="w-12 h-12 p-0 border-0 rounded-full overflow-hidden cursor-pointer opacity-0 absolute z-10"
                                                />
                                                <div className="w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
                                                    <Plus className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg shadow-sm" style={{ backgroundColor: primaryColor }} />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Màu hiện tại: {primaryColor}</p>
                                                <p className="text-xs text-muted-foreground">Màu này sẽ được áp dụng cho toàn bộ nút bấm và điểm nhấn.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Default View Mode */}
                                    <div className="space-y-4 pt-6 border-t border-gray-100">
                                        <Label className="text-base font-semibold">Chế độ xem mặc định (Kho đồ)</Label>
                                        <p className="text-xs text-muted-foreground -mt-2">Chọn cách hiển thị thiết bị mặc định khi mở trang Kho đồ</p>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { value: 'grid', label: 'Lưới', icon: '🔲', desc: 'Icon thiết bị' },
                                                { value: 'grid-thumb', label: 'Thumbnail', icon: '🖼️', desc: 'Ảnh thu nhỏ' },
                                                { value: 'list', label: 'Danh sách', icon: '📋', desc: 'Chi tiết hàng' },
                                            ].map(mode => {
                                                const savedMode = typeof window !== 'undefined' ? localStorage.getItem('defaultViewMode') : 'grid';
                                                const isActive = savedMode === mode.value || (!savedMode && mode.value === 'grid');
                                                return (
                                                    <button
                                                        key={mode.value}
                                                        type="button"
                                                        onClick={() => {
                                                            localStorage.setItem('defaultViewMode', mode.value);
                                                            toast(`Đã đặt chế độ xem mặc định: ${mode.label}`, 'success');
                                                        }}
                                                        className={`p-4 rounded-xl border-2 transition-all text-center hover:shadow-md ${isActive ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                                                    >
                                                        <span className="text-2xl block mb-1">{mode.icon}</span>
                                                        <span className={`font-semibold text-sm ${isActive ? 'text-primary-700' : 'text-gray-700'}`}>{mode.label}</span>
                                                        <span className="text-[10px] text-gray-400 block">{mode.desc}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <p className="text-[10px] text-gray-400">💡 Tip: Khi F5 trang Kho đồ sẽ tự động hiển thị theo chế độ bạn chọn ở đây.</p>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-gray-100">
                                        <Button onClick={handleSaveTheme} disabled={loading} className="bg-gray-900 hover:bg-black text-white px-8 rounded-xl">
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Áp dụng ngay
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* APP CONFIG SETTINGS */}
                        <TabsContent value="app" className="mt-0">
                            <Card className="border-none shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 rounded-2xl">
                                <CardHeader className="px-8 pt-8">
                                    <CardTitle>Cấu hình dữ liệu</CardTitle>
                                    <p className="text-sm text-muted-foreground">Quản lý các danh mục và gợi ý nhập liệu</p>
                                </CardHeader>
                                <CardContent className="px-8 pb-8 space-y-6">
                                    <div className="space-y-4 p-5 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-gray-900">Thêm Hãng (Brand)</h4>
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Tự động gợi ý</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Thêm các hãng sản xuất mới để hệ thống gợi ý khi nhập kho.</p>
                                        <form onSubmit={handleAddBrand} className="flex gap-3 mt-2">
                                            <Input
                                                placeholder="Ví dụ: Anker, Dell, Logitech..."
                                                value={brandName}
                                                onChange={e => setBrandName(e.target.value)}
                                                className="bg-white"
                                            />
                                            <Button type="submit" disabled={!brandName || loading} className="shrink-0">
                                                <Plus className="mr-2 h-4 w-4" /> Thêm mới
                                            </Button>
                                        </form>

                                        {/* Brands List */}
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <Label className="text-xs uppercase font-bold text-gray-500 mb-3 block">Danh sách hãng hiện có</Label>
                                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                                                {brandsList.map((b) => (
                                                    <div key={b.id} className="group flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded-md text-sm shadow-sm hover:border-orange-300 transition-colors">
                                                        <span>{b.name}</span>
                                                    </div>
                                                ))}
                                                {brandsList.length === 0 && <span className="text-sm text-gray-400 italic">Chưa có hãng nào.</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Item Types Management */}
                                    <div className="space-y-4 p-5 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-gray-900">Quản lý Loại thiết bị</h4>
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Tùy chỉnh</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Thêm các loại thiết bị mới để phân loại khi nhập kho. Những loại tùy chỉnh sẽ xuất hiện trong dropdown "Loại" khi thêm thiết bị.</p>
                                        <ItemTypeManager />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* SYSTEM SETTINGS - NEW */}
                        <TabsContent value="system" className="mt-0">
                            <Card className="border-none shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 rounded-2xl">
                                <CardHeader className="px-8 pt-8">
                                    <CardTitle>Hệ thống & Tích hợp</CardTitle>
                                    <p className="text-sm text-muted-foreground">Sao lưu dữ liệu và quản lý kết nối API</p>
                                </CardHeader>
                                <CardContent className="px-8 pb-8 space-y-8">
                                    {/* Backup & Restore */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-gray-900 font-semibold text-base mb-2">
                                            <Database className="w-5 h-5 text-purple-600" />
                                            <span>Sao lưu & Khôi phục</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* JSON Backup */}
                                            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 flex flex-col gap-2">
                                                <div className="flex justify-between items-center">
                                                    <h5 className="font-semibold text-sm">Backup Cơ bản (JSON)</h5>
                                                    <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">Nhẹ</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mb-2">Chỉ chứa dữ liệu văn bản. Không bao gồm ảnh.</p>
                                                <Button onClick={handleExport} disabled={loading} variant="outline" className="w-full bg-white hover:bg-gray-100 text-xs h-8">
                                                    <Download className="mr-2 h-3.5 w-3.5" /> Tải JSON
                                                </Button>
                                            </div>

                                            {/* ZIP Backup */}
                                            <div className="p-4 border border-blue-100 ring-1 ring-blue-200 rounded-xl bg-blue-50/50 flex flex-col gap-2 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-1 bg-blue-500 rounded-bl-lg">
                                                    <span className="text-[10px] font-bold text-white px-1">KHUYÊN DÙNG</span>
                                                </div>
                                                <h5 className="font-semibold text-sm text-blue-900">Backup Đầy đủ (ZIP)</h5>
                                                <p className="text-xs text-blue-700/80 mb-2">Bao gồm toàn bộ dữ liệu VÀ hình ảnh.</p>
                                                <Button onClick={handleExportFull} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 shadow-sm">
                                                    <Download className="mr-2 h-3.5 w-3.5" /> Tải ZIP (Full)
                                                </Button>
                                            </div>

                                            {/* Restore Section */}
                                            <div className="md:col-span-2 p-4 border border-gray-200 rounded-xl bg-gray-50 flex flex-col gap-3 mt-2">
                                                <h5 className="font-semibold text-sm flex items-center gap-2">
                                                    <Upload className="w-4 h-4 text-gray-500" /> Nhập dữ liệu (Khôi phục)
                                                </h5>
                                                <p className="text-xs text-gray-500">Hỗ trợ cả file .json (cơ bản) và .zip (đầy đủ)</p>

                                                <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-white p-3 rounded-lg border border-gray-200">
                                                    <div className="flex-1 w-full">
                                                        <Input
                                                            type="file"
                                                            accept=".json,.zip"
                                                            onChange={e => setImportFile(e.target.files?.[0] || null)}
                                                            className="bg-gray-50 h-9 text-xs file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                                                        />
                                                    </div>

                                                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer whitespace-nowrap select-none">
                                                        <input type="checkbox" checked={clearBeforeImport} onChange={e => setClearBeforeImport(e.target.checked)} className="rounded border-gray-300 w-4 h-4 text-primary-600 focus:ring-primary-500" />
                                                        Xóa dữ liệu cũ
                                                    </label>

                                                    <Button onClick={handleImport} disabled={!importFile || loading} className="shrink-0 bg-red-600 hover:bg-red-700 text-white h-9 px-4 shadow-sm">
                                                        Khôi phục
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full h-px bg-gray-100" />

                                    {/* API Keys */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-gray-900 font-semibold text-base">
                                                <Key className="w-5 h-5 text-emerald-600" />
                                                <span>API Connect</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500">Quản lý khóa truy cập cho ứng dụng bên thứ 3 (Mobile App, Telegram Bot...).</p>

                                        <div className="flex gap-2 items-end p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-xs font-bold text-emerald-800">Tên ứng dụng</Label>
                                                <Input
                                                    value={newKeyName}
                                                    onChange={e => setNewKeyName(e.target.value)}
                                                    placeholder="VD: Telegram Bot"
                                                    className="bg-white border-emerald-200"
                                                />
                                            </div>
                                            <Button onClick={handleGenerateKey} disabled={!newKeyName || loading} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                                                <Plus className="mr-2 h-4 w-4" /> Tạo khóa
                                            </Button>
                                        </div>

                                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                            {apiKeys.map((k) => (
                                                <div key={k.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-bold text-sm text-gray-800">{k.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <code className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">{k.key}</code>
                                                            <Button variant="ghost" size="icon" className="h-4 w-4 text-gray-400 hover:text-blue-600" onClick={() => copyToClipboard(k.key)} title="Copy">
                                                                <Copy className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                        <span className="text-[10px] text-gray-400">Tạo: {new Date(k.createdAt).toLocaleDateString()} • Dùng cuối: {k.lastUsed ? new Date(k.lastUsed).toLocaleDateString() : 'Chưa dùng'}</span>
                                                    </div>
                                                    <Button variant="ghost" size="icon" onClick={() => handleRevokeKey(k.id)} className="h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            {apiKeys.length === 0 && <p className="text-center text-sm text-gray-400 italic py-4">Chưa có khóa API nào.</p>}
                                        </div>
                                    </div>

                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* AUDIT LOG TAB */}
                        <TabsContent value="audit" className="mt-0">
                            <AuditLogViewer />
                        </TabsContent>

                    </div>
                </Tabs>
            </div>
        </div>
    );
}
