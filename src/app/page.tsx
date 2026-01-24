import { SmartAddForm } from "@/features/inventory/SmartAddForm";
import { InventoryList } from "@/features/inventory/InventoryList";
import { LocationManager } from "@/features/location/LocationManager";
import AnalyticsDashboard from "@/features/analytics/AnalyticsDashboard";
import { getLocations, getLocationHierarchy } from "@/features/location/actions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/primitives";
import { Box, PlusCircle, Map, LayoutGrid, BarChart3 } from "lucide-react";
import UserMenu from "@/components/UserMenu";
import { QrScannerButton } from "@/features/qr/QrScanner";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const flatLocations = await getLocations();
  const locationTree = await getLocationHierarchy();

  return (
    <main className="min-h-screen bg-primary-50/30 dark:bg-gray-900 pb-20">
      {/* Header - Full Width but centered content */}
      <div className="bg-white/80 dark:bg-gray-900/80 sticky top-0 z-40 backdrop-blur-md border-b border-primary-100 dark:border-gray-700 shadow-sm">
        <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4 flex items-center justify-between gap-3 max-w-5xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
              <Box className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">TechGadget Manager</h1>
              <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">Quản lý kho đồ công nghệ cá nhân</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <QrScannerButton />
            <UserMenu />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-5xl">
        <Tabs defaultValue="inventory" className="space-y-4 sm:space-y-8">
          {/* Centered Tabs List */}
          {/* Centered Tabs List - Sticky Floating Pill */}
          <div className="flex justify-center sticky top-[70px] z-[35] py-2 bg-primary-50/10 backdrop-blur-[1px]">
            <TabsList className="grid w-full max-w-[600px] grid-cols-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-lg border border-primary-100 dark:border-gray-700 p-1 h-auto rounded-full ring-1 ring-black/5">
              <TabsTrigger value="inventory" className="data-[state=active]:bg-primary-500 data-[state=active]:text-white data-[state=active]:shadow-md py-2 sm:py-2.5 rounded-full transition-all duration-300 font-medium text-[10px] sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5">
                <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Kho Đồ</span><span className="sm:hidden">Kho</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-primary-500 data-[state=active]:text-white data-[state=active]:shadow-md py-2 sm:py-2.5 rounded-full transition-all duration-300 font-medium text-[10px] sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Thống kê</span><span className="sm:hidden">TK</span>
              </TabsTrigger>
              <TabsTrigger value="locations" className="data-[state=active]:bg-primary-500 data-[state=active]:text-white data-[state=active]:shadow-md py-2 sm:py-2.5 rounded-full transition-all duration-300 font-medium text-[10px] sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5">
                <Map className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Vị trí</span><span className="sm:hidden">VT</span>
              </TabsTrigger>
              <TabsTrigger value="add" className="data-[state=active]:bg-primary-500 data-[state=active]:text-white data-[state=active]:shadow-md py-2 sm:py-2.5 rounded-full transition-all duration-300 font-medium text-[10px] sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5">
                <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Thêm</span><span className="sm:hidden">+</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="inventory" className="space-y-4 animate-in slide-in-from-bottom-5 duration-500 fade-in">
            <InventoryList />
          </TabsContent>

          <TabsContent value="analytics" lazy className="pt-4 animate-in slide-in-from-bottom-5 duration-500 fade-in">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="add" className="max-w-2xl mx-auto pt-4 animate-in slide-in-from-bottom-5 duration-500 fade-in">
            <SmartAddForm locations={flatLocations} />
          </TabsContent>

          <TabsContent value="locations" lazy className="pt-4 animate-in slide-in-from-bottom-5 duration-500 fade-in">
            <LocationManager initialLocations={locationTree} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
