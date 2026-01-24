"use server";

import { prisma } from "@/lib/db";

export interface CategoryStats {
    name: string;
    value: number;
    fill?: string;
}

export interface BrandStats {
    name: string;
    count: number;
}

export interface MonthlyTrend {
    month: string;
    count: number;
    value: number;
}

export interface AnalyticsData {
    categoryDistribution: CategoryStats[];
    topBrands: BrandStats[];
    monthlyPurchaseTrend: MonthlyTrend[];
    statusDistribution: CategoryStats[];
    priceDistribution: CategoryStats[];
    locationDistribution: CategoryStats[];
    totalValue: number;
    totalItems: number;
    averageItemValue: number;
}

const CATEGORY_COLORS: Record<string, string> = {
    'Cable': '#f97316',
    'Charger': '#eab308',
    'PowerBank': '#8b5cf6',
    'Laptop': '#3b82f6',
    'Phone': '#10b981',
    'Tablet': '#06b6d4',
    'Headphone': '#ec4899',
    'Storage': '#6366f1',
    'Accessory': '#64748b',
    'Other': '#94a3b8',
};

export async function getAnalyticsData(): Promise<AnalyticsData> {
    try {
        const items = await prisma.item.findMany({
            select: {
                id: true,
                type: true,
                category: true,
                brand: true,
                status: true,
                purchasePrice: true,
                purchaseDate: true,
                createdAt: true,
                location: { select: { id: true, name: true } }
            }
        });

        // Price Distribution
        const priceRanges = {
            'Under 500k': 0,
            '500k - 2M': 0,
            '2M - 10M': 0,
            '10M - 30M': 0,
            'Over 30M': 0
        };

        items.forEach(item => {
            const price = item.purchasePrice || 0;
            if (price < 500000) priceRanges['Under 500k']++;
            else if (price < 2000000) priceRanges['500k - 2M']++;
            else if (price < 10000000) priceRanges['2M - 10M']++;
            else if (price < 30000000) priceRanges['10M - 30M']++;
            else priceRanges['Over 30M']++;
        });

        const priceDistribution: CategoryStats[] = Object.entries(priceRanges).map(([name, value]) => ({
            name,
            value,
            fill: '#ea580c' // Orange theme
        }));

        // Location Distribution
        const locationCount: Record<string, number> = {};
        items.forEach(item => {
            const locName = item.location?.name || 'Chưa phân loại';
            locationCount[locName] = (locationCount[locName] || 0) + 1;
        });

        const locationDistribution: CategoryStats[] = Object.entries(locationCount)
            .map(([name, value]) => ({
                name,
                value,
                fill: '#3b82f6' // Blue theme
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);


        // Category Distribution
        const categoryCount: Record<string, number> = {};
        items.forEach(item => {
            const cat = item.type || item.category || 'Other';
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });
        const categoryDistribution: CategoryStats[] = Object.entries(categoryCount)
            .map(([name, value]) => ({
                name,
                value,
                fill: CATEGORY_COLORS[name] || '#94a3b8'
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);

        // Top Brands
        const brandCount: Record<string, number> = {};
        items.forEach(item => {
            if (item.brand) {
                brandCount[item.brand] = (brandCount[item.brand] || 0) + 1;
            }
        });
        const topBrands: BrandStats[] = Object.entries(brandCount)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Monthly Purchase Trend (last 12 months)
        const now = new Date();
        const monthlyData: Record<string, { count: number; value: number }> = {};

        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[key] = { count: 0, value: 0 };
        }

        items.forEach(item => {
            const date = item.purchaseDate || item.createdAt;
            if (date) {
                const d = new Date(date);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (monthlyData[key]) {
                    monthlyData[key].count++;
                    monthlyData[key].value += item.purchasePrice || 0;
                }
            }
        });

        const monthlyPurchaseTrend: MonthlyTrend[] = Object.entries(monthlyData).map(([month, data]) => ({
            month: formatMonth(month),
            count: data.count,
            value: data.value
        }));

        // Status Distribution
        const statusCount: Record<string, number> = {};
        items.forEach(item => {
            statusCount[item.status] = (statusCount[item.status] || 0) + 1;
        });
        const statusDistribution: CategoryStats[] = Object.entries(statusCount).map(([name, value]) => {
            let fill = '#94a3b8';
            if (name === 'Available') fill = '#10b981';
            if (name === 'Lent') fill = '#8b5cf6';
            if (name === 'InUse') fill = '#3b82f6';
            if (name === 'Broken') fill = '#ef4444';
            return { name: formatStatus(name), value, fill };
        });

        // Summary stats
        const totalValue = items.reduce((acc, item) => acc + (item.purchasePrice || 0), 0);
        const totalItems = items.length;
        const averageItemValue = totalItems > 0 ? totalValue / totalItems : 0;

        return {
            categoryDistribution,
            priceDistribution,
            locationDistribution,
            topBrands,
            monthlyPurchaseTrend,
            statusDistribution,
            totalValue,
            totalItems,
            averageItemValue,
        };
    } catch (error) {
        console.error("Analytics error:", error);
        return {
            categoryDistribution: [],
            priceDistribution: [],
            locationDistribution: [],
            topBrands: [],
            monthlyPurchaseTrend: [],
            statusDistribution: [],
            totalValue: 0,
            totalItems: 0,
            averageItemValue: 0,
        };
    }
}

function formatMonth(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    return monthNames[parseInt(month) - 1] || month;
}

function formatStatus(status: string): string {
    const map: Record<string, string> = {
        'Available': 'Sẵn sàng',
        'Lent': 'Cho mượn',
        'InUse': 'Đang dùng',
        'Broken': 'Hỏng',
    };
    return map[status] || status;
}
