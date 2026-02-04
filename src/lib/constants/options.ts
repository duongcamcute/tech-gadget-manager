import {
    Package,
    Smartphone, Tablet, Laptop, Monitor, Tv, Camera, Gamepad2, Headset, Speaker,
    Mouse, Keyboard, HardDrive, Server, Router, Printer, Mic, Watch, Box,
    Fan, Lightbulb, Plug, Battery, Wrench, Key, Shield, HelpCircle,
    // New Imports
    Presentation, Scan, Calculator, Briefcase, FileText, Folder, Archive, Tag,
    Cpu, CircuitBoard, MemoryStick, Database,
    Wifi, Bluetooth, Cast, Bell, Lock, Thermometer,
    CassetteTape, Disc, Clapperboard, Film, Radio,
    Wallet, CreditCard, Gift, Map, Umbrella,
    Cable,
    // Location Icons
    Home, Building, Warehouse, Store, MapPin,
    Sofa, Bed, Utensils,
    Library,
    Container, Backpack, Luggage,
    User, Users,
    Table, Layers,
    type LucideIcon
} from "lucide-react";

interface IconConfig {
    icon: LucideIcon;
    color: string;
    bg: string;
}

export const ITEM_TYPES = [
    // Core Devices
    { value: "Phone", label: "Điện thoại" },
    { value: "Tablet", label: "Máy tính bảng" },
    { value: "Laptop", label: "Laptop / MacBook" },
    { value: "Monitor", label: "Màn hình" },
    { value: "PC", label: "PC / Desktop" },
    { value: "Watch", label: "Đồng hồ thông minh" },

    // Charging & Cables
    { value: "Charger", label: "Củ sạc / Adapter" },
    { value: "Cable", label: "Dây cáp (Sạc/Data)" },
    { value: "PowerBank", label: "Sạc dự phòng" },
    { value: "Hub", label: "Hub / Dock chuyển đổi" },

    // Audio & Photo
    { value: "Audio", label: "Tai nghe / Loa" },
    { value: "Camera", label: "Máy ảnh / Lens" },
    { value: "Mic", label: "Microphone" },

    // Peripherals
    { value: "Mouse", label: "Chuột" },
    { value: "Keyboard", label: "Bàn phím" },
    { value: "Storage", label: "Ổ cứng / USB / Thẻ nhớ" },
    { value: "Printer", label: "Máy in / Scan" },

    // Smart Home & IoT
    { value: "Wifi", label: "Router / Wifi" },
    { value: "Smarthome", label: "Nhà thông minh (Đèn/Ổ cắm...)" },
    { value: "Drone", label: "Drone / Flycam" },
    { value: "Gaming", label: "Tay cầm / Console Game" },

    // Tools & Others
    { value: "Tools", label: "Công cụ / Tools" },
    { value: "Backpack", label: "Balo / Túi đựng" },
    { value: "Software", label: "Phần mềm / Key" },
    { value: "Other", label: "Khác" },
] as const;

export const ITEM_STATUS = {
    Available: { label: "Sẵn sàng", color: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100" },
    InUse: { label: "Đang dùng", color: "bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-100" },
    Lent: { label: "Cho mượn", color: "bg-primary-50 text-primary-700 border-primary-200 ring-1 ring-primary-100" },
    Lost: { label: "Thất lạc", color: "bg-red-50 text-red-700 border-red-200 ring-1 ring-red-100" },
} as const;

export const ITEM_ICONS: Record<string, IconConfig> = {
    // ... (Keep existing first)
    'Phone': { icon: Smartphone, color: 'text-blue-500', bg: 'bg-blue-50' },
    'Tablet': { icon: Tablet, color: 'text-purple-500', bg: 'bg-purple-50' },
    'Laptop': { icon: Laptop, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    'Monitor': { icon: Monitor, color: 'text-slate-600', bg: 'bg-slate-50' },
    'Tv': { icon: Tv, color: 'text-slate-700', bg: 'bg-slate-100' },
    'Camera': { icon: Camera, color: 'text-rose-500', bg: 'bg-rose-50' },
    'Gaming': { icon: Gamepad2, color: 'text-violet-500', bg: 'bg-violet-50' },
    'VR': { icon: Headset, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50' },
    'Drone': { icon: Fan, color: 'text-sky-500', bg: 'bg-sky-50' },
    'Watch': { icon: Watch, color: 'text-amber-500', bg: 'bg-amber-50' },
    'Device': { icon: Smartphone, color: 'text-gray-500', bg: 'bg-gray-50' },

    // Accessories
    'Charger': { icon: Plug, color: 'text-green-500', bg: 'bg-green-50' },
    'Cable': { icon: Cable, color: 'text-gray-500', bg: 'bg-gray-100' },
    'PowerBank': { icon: Battery, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    'Battery': { icon: Battery, color: 'text-lime-500', bg: 'bg-lime-50' },
    'Audio': { icon: Speaker, color: 'text-pink-500', bg: 'bg-pink-50' },
    'Headphones': { icon: Headset, color: 'text-pink-600', bg: 'bg-pink-50' },
    'Speaker': { icon: Speaker, color: 'text-orange-500', bg: 'bg-orange-50' },
    'Mouse': { icon: Mouse, color: 'text-stone-500', bg: 'bg-stone-50' },
    'Keyboard': { icon: Keyboard, color: 'text-stone-600', bg: 'bg-stone-50' },
    'Hub': { icon: Router, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    'Storage': { icon: HardDrive, color: 'text-amber-600', bg: 'bg-amber-50' },
    'HardDrive': { icon: HardDrive, color: 'text-amber-700', bg: 'bg-amber-100' },
    'Server': { icon: Server, color: 'text-indigo-700', bg: 'bg-indigo-100' },
    'Network': { icon: Router, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    'Printer': { icon: Printer, color: 'text-slate-500', bg: 'bg-slate-100' },
    'Mic': { icon: Mic, color: 'text-red-500', bg: 'bg-red-50' },

    // ... New Icons ...
    // Office
    // Office
    'Projector': { icon: Presentation, color: 'text-blue-400', bg: 'bg-blue-50' },
    'Scanner': { icon: Scan, color: 'text-slate-500', bg: 'bg-slate-50' },
    'Calculator': { icon: Calculator, color: 'text-orange-400', bg: 'bg-orange-50' },
    'Briefcase': { icon: Briefcase, color: 'text-yellow-700', bg: 'bg-yellow-50' },
    'File': { icon: FileText, color: 'text-blue-300', bg: 'bg-blue-50' },
    'Folder': { icon: Folder, color: 'text-yellow-400', bg: 'bg-yellow-50' },
    'Archive': { icon: Archive, color: 'text-amber-700', bg: 'bg-amber-50' },
    'Tag': { icon: Tag, color: 'text-rose-400', bg: 'bg-rose-50' },

    // Components
    'Cpu': { icon: Cpu, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    'Circuit': { icon: CircuitBoard, color: 'text-green-600', bg: 'bg-green-50' },
    'Ram': { icon: MemoryStick, color: 'text-green-500', bg: 'bg-green-100' },
    'Database': { icon: Database, color: 'text-blue-600', bg: 'bg-blue-50' },

    // Smart Home / Net
    'Wifi': { icon: Wifi, color: 'text-sky-500', bg: 'bg-sky-50' },
    'Bluetooth': { icon: Bluetooth, color: 'text-blue-600', bg: 'bg-blue-50' },
    'Cast': { icon: Cast, color: 'text-orange-500', bg: 'bg-orange-50' },
    'Bell': { icon: Bell, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    'Lock': { icon: Lock, color: 'text-slate-600', bg: 'bg-slate-100' },
    'Thermo': { icon: Thermometer, color: 'text-red-400', bg: 'bg-red-50' },

    // Media
    'Cassette': { icon: CassetteTape, color: 'text-purple-400', bg: 'bg-purple-50' },
    'Disc': { icon: Disc, color: 'text-fuchsia-400', bg: 'bg-fuchsia-50' },
    'Clapper': { icon: Clapperboard, color: 'text-slate-800', bg: 'bg-slate-200' },
    'Film': { icon: Film, color: 'text-slate-700', bg: 'bg-slate-100' },
    'Radio': { icon: Radio, color: 'text-lime-600', bg: 'bg-lime-50' },

    // Misc
    'Wallet': { icon: Wallet, color: 'text-stone-700', bg: 'bg-stone-200' },
    'Card': { icon: CreditCard, color: 'text-indigo-400', bg: 'bg-indigo-50' },
    'Gift': { icon: Gift, color: 'text-pink-400', bg: 'bg-pink-50' },
    'Map': { icon: Map, color: 'text-green-600', bg: 'bg-green-50' },
    'Umbrella': { icon: Umbrella, color: 'text-blue-400', bg: 'bg-blue-100' },

    'Fan': { icon: Fan, color: 'text-teal-500', bg: 'bg-teal-50' },
    'Light': { icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-50' },
    'Plug': { icon: Plug, color: 'text-gray-600', bg: 'bg-gray-100' },
    'Tools': { icon: Wrench, color: 'text-slate-500', bg: 'bg-slate-50' },
    'Key': { icon: Key, color: 'text-amber-500', bg: 'bg-amber-100' },
    'Shield': { icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
    'Box': { icon: Box, color: 'text-amber-800', bg: 'bg-amber-50' },
    'Other': { icon: HelpCircle, color: 'text-gray-500', bg: 'bg-gray-50' },
    'default': { icon: Box, color: 'text-gray-400', bg: 'bg-gray-50' },
};

export const LOCATION_ICONS: Record<string, IconConfig> = {
    // Rooms & Spaces
    'Home': { icon: Home, color: 'text-blue-500', bg: 'bg-blue-50' },
    'Room': { icon: Sofa, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    'Bedroom': { icon: Bed, color: 'text-purple-500', bg: 'bg-purple-50' },
    'Kitchen': { icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-50' },
    'Office': { icon: Building, color: 'text-slate-600', bg: 'bg-slate-50' },
    'Store': { icon: Store, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    'Warehouse': { icon: Warehouse, color: 'text-slate-700', bg: 'bg-slate-100' },

    // Furniture
    'Table': { icon: Table, color: 'text-amber-700', bg: 'bg-amber-100' },
    'Shelf': { icon: Library, color: 'text-amber-600', bg: 'bg-amber-50' },
    'Cabinet': { icon: Archive, color: 'text-amber-800', bg: 'bg-amber-50' },
    'Drawer': { icon: Layers, color: 'text-amber-500', bg: 'bg-amber-50' },

    // Containers
    'Box': { icon: Box, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    'Package': { icon: Package, color: 'text-yellow-700', bg: 'bg-yellow-100' },
    'Bin': { icon: Container, color: 'text-gray-500', bg: 'bg-gray-100' },

    // Mobile / Bags
    'Bag': { icon: Briefcase, color: 'text-rose-600', bg: 'bg-rose-50' },
    'Backpack': { icon: Backpack, color: 'text-rose-500', bg: 'bg-rose-50' },
    'Luggage': { icon: Luggage, color: 'text-rose-700', bg: 'bg-rose-100' },

    // People
    'Person': { icon: User, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    'Family': { icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },

    // Default
    'default': { icon: MapPin, color: 'text-gray-400', bg: 'bg-gray-50' },
};

export const ITEM_ICON_GROUPS = [
    {
        label: "Thiết bị chính",
        items: ["Phone", "Tablet", "Laptop", "Monitor", "Tv", "Camera", "Gaming", "VR", "Drone", "Watch", "Device"]
    },
    {
        label: "Phụ kiện & Linh kiện",
        items: ["Charger", "Cable", "PowerBank", "Battery", "Audio", "Headphones", "Speaker", "Mouse", "Keyboard", "Hub", "Storage", "HardDrive", "Server", "Network", "Printer", "Mic", "Cpu", "Circuit", "Ram", "Database"]
    },
    {
        label: "Văn phòng & Công cụ",
        items: ["Projector", "Scanner", "Calculator", "Briefcase", "File", "Folder", "Archive", "Tag", "Tools", "Box", "Gift", "Map"]
    },
    {
        label: "Thông minh & Mạng",
        items: ["Wifi", "Bluetooth", "Cast", "Bell", "Lock", "Thermo", "Fan", "Light", "Plug", "Shield", "Key"]
    },
    {
        label: "Giải trí & Khác",
        items: ["Cassette", "Disc", "Clapper", "Film", "Radio", "Wallet", "Card", "Umbrella", "Other"]
    }
];

export const LOCATION_ICON_GROUPS = [
    {
        label: "Không gian & Phòng",
        items: ["Home", "Room", "Bedroom", "Kitchen", "Office", "Store", "Warehouse"]
    },
    {
        label: "Nội thất & Lưu trữ",
        items: ["Table", "Shelf", "Cabinet", "Drawer", "Box", "Package", "Bin"]
    },
    {
        label: "Di động & Túi",
        items: ["Bag", "Backpack", "Luggage"]
    },
    {
        label: "Con người",
        items: ["Person", "Family"]
    }
];
