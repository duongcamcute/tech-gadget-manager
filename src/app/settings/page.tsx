
"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { updateUserProfile, saveThemeSettings, addBrandAction, getBrands, createTemplate, deleteTemplate, getTemplates, exportDatabase, importDatabase, generateApiKey, revokeApiKey, getApiKeys } from "@/app/actions";
import { ITEM_TYPES } from "@/lib/constants/options";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { Loader2, Save, Plus, ArrowLeft, Trash2, LayoutGrid, Palette, User, ShieldCheck, Home, Server, Key, Download, Upload, Copy, Database } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

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
    const [brandsList, setBrandsList] = useState<any[]>([]);

    // API & System State
    const [apiKeys, setApiKeys] = useState<any[]>([]);
    const [newKeyName, setNewKeyName] = useState("");
    const [importFile, setImportFile] = useState<File | null>(null);
    const [clearBeforeImport, setClearBeforeImport] = useState(false);

    useEffect(() => {
        loadBrands();
        loadApiKeys();
    }, []);

    const loadBrands = async () => {
        try {
            const res = await getBrands();
            setBrandsList(res);
        } catch (e) { }
    };

    const loadApiKeys = async () => {
        try {
            const res = await getApiKeys();
            setApiKeys(res);
        } catch (e) { }
    };

    // ... inside component

    // Template State
    const [templates, setTemplates] = useState<any[]>([]);
    const [newTemplateName, setNewTemplateName] = useState("");
    // Visual Editor State
    const [tempType, setTempType] = useState(ITEM_TYPES[0].value);
    const [tempBrand, setTempBrand] = useState("");
    const [tempSpecs, setTempSpecs] = useState<{ key: string, value: string }[]>([{ key: "", value: "" }]);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const res = await getTemplates();
            setTemplates(res);
        } catch (e) { }
    };

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
        const res = await exportDatabase();
        if (res.success && res.data) {
            const blob = new Blob([res.data], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `backup_tgm_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast("Xuất dữ liệu thành công", "success");
        } else {
            toast(res.error || "Lỗi xuất file", "error");
        }
        setLoading(false);
    };

    const handleImport = async () => {
        if (!importFile) return;
        if (clearBeforeImport && !confirm("CẢNH BÁO: Bạn có chắc muốn xóa TOÀN BỘ dữ liệu hiện tại trước khi nhập không? Hành động này không thể hoàn tác!")) return;

        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            const res = await importDatabase(text, clearBeforeImport);
            if (res.success) {
                toast("Nhập dữ liệu thành công", "success");
                setTimeout(() => window.location.reload(), 1000);
            } else {
                toast(res.error || "Lỗi nhập file", "error");
            }
            setLoading(false);
        };
        reader.readAsText(importFile);
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
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
                <div className="container mx-auto px-4 h-16 flex items-center gap-4 max-w-4xl">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="rounded-full hover:bg-gray-100 -ml-2">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Button>
                    <h1 className="text-lg font-bold text-gray-900">Cài đặt hệ thống</h1>
                    <div className="ml-auto">
                        <Button variant="outline" size="sm" onClick={() => router.push("/")} className="hidden sm:flex items-center gap-2">
                            <Home className="w-4 h-4" /> Về trang chủ
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto p-4 md:p-8 max-w-4xl">
                <Tabs defaultValue="account" className="w-full flex flex-col md:flex-row gap-8 items-start">

                    {/* Sidebar Navigation */}
                    <TabsList className="flex flex-col w-full md:w-64 h-auto bg-white p-2 rounded-2xl shadow-sm border border-gray-100 gap-1 md:sticky md:top-24">
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
                    </TabsList>

                    {/* Main Content Area */}
                    <div className="flex-1 w-full space-y-6">

                        {/* ACCOUNT SETTINGS */}
                        <TabsContent value="account" className="mt-0">
                            {/* ... kept existing ... */}
                            <Card className="border-none shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden">
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
                            <Card className="border-none shadow-lg shadow-gray-200/50 rounded-2xl">
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
                            <Card className="border-none shadow-lg shadow-gray-200/50 rounded-2xl">
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
                                                {brandsList.map((b: any) => (
                                                    <div key={b.id} className="group flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded-md text-sm shadow-sm hover:border-orange-300 transition-colors">
                                                        <span>{b.name}</span>
                                                    </div>
                                                ))}
                                                {brandsList.length === 0 && <span className="text-sm text-gray-400 italic">Chưa có hãng nào.</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Future expansion for Categories, Locations management */}
                                    <div className="text-center p-8 text-muted-foreground text-sm">
                                        Tính năng quản lý Danh mục & Vị trí nâng cao đang được phát triển.
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* SYSTEM SETTINGS - NEW */}
                        <TabsContent value="system" className="mt-0">
                            <Card className="border-none shadow-lg shadow-gray-200/50 rounded-2xl">
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
                                            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 flex flex-col gap-2">
                                                <h5 className="font-semibold text-sm">Xuất dữ liệu (Backup)</h5>
                                                <p className="text-xs text-gray-500 mb-2">Tải về toàn bộ dữ liệu dưới dạng file JSON.</p>
                                                <Button onClick={handleExport} disabled={loading} variant="outline" className="w-full bg-white hover:bg-gray-100">
                                                    <Download className="mr-2 h-4 w-4" /> Tải về ngay
                                                </Button>
                                            </div>
                                            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 flex flex-col gap-2">
                                                <h5 className="font-semibold text-sm">Nhập dữ liệu (Restore)</h5>
                                                <p className="text-xs text-gray-500 mb-2">Khôi phục từ file JSON đã xuất trước đó.</p>
                                                <div className="flex flex-col gap-2">
                                                    <Input type="file" accept=".json" onChange={e => setImportFile(e.target.files?.[0] || null)} className="bg-white h-9 text-xs" />
                                                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                                                        <input type="checkbox" checked={clearBeforeImport} onChange={e => setClearBeforeImport(e.target.checked)} className="rounded border-gray-300" />
                                                        Xóa dữ liệu cũ trước khi nhập
                                                    </label>
                                                    <Button onClick={handleImport} disabled={!importFile || loading} className="w-full">
                                                        <Upload className="mr-2 h-4 w-4" /> Tiến hành nhập
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
                                            {apiKeys.map((k: any) => (
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

                    </div>
                </Tabs>
            </div>
        </div>
    );
}
