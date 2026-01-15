import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import InventoryManager from '../InventoryManager';
import React from 'react';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Search: () => <div data-testid="icon-search" />,
    Package: () => <div data-testid="icon-package" />,
    Zap: () => <div data-testid="icon-zap" />,
    HardDrive: () => <div data-testid="icon-harddrive" />,
    Cable: () => <div data-testid="icon-cable" />,
    Battery: () => <div data-testid="icon-battery" />,
    Headphones: () => <div data-testid="icon-headphones" />,
    Database: () => <div data-testid="icon-database" />,
    LayoutDashboard: () => <div data-testid="icon-dashboard" />,
    Tag: () => <div data-testid="icon-tag" />,
    Wallet: () => <div data-testid="icon-wallet" />,
    QrCode: () => <div data-testid="icon-qrcode" />,
}));

vi.mock('../ItemDetailDialog', () => ({
    ItemDetailDialog: ({ isOpen }: any) => isOpen ? <div data-testid="detail-dialog">Detail Dialog</div> : null
}));

vi.mock('../ItemActions', () => ({
    ItemActions: () => <button>Action</button>
}));

// Mock router and toast
vi.mock("next/navigation", () => ({
    useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() })
}));

vi.mock("@/components/ui/toast", () => ({
    useToast: () => ({ toast: vi.fn() })
}));

describe('InventoryManager', () => {
    const mockItems = [
        { id: '1', name: 'iPhone 15', type: 'Other', status: 'Available', brand: 'Apple', location: { name: 'Home' }, specs: '{}', purchasePrice: 20000000 },
        { id: '2', name: 'MacBook Pro', type: 'Other', status: 'InUse', brand: 'Apple', location: { name: 'Office' }, specs: '{}', purchasePrice: 40000000 },
        { id: '3', name: 'USB-C Cable', type: 'Cable', status: 'Lent', brand: 'Anker', location: { name: 'Bag' }, specs: '{}', purchasePrice: 500000 },
    ];
    const mockLocations = [{ id: 'loc1', name: 'Home' }];

    it('renders dashboard stats correctly', () => {
        render(<InventoryManager initialItems={mockItems} locations={mockLocations} />);

        // Check for "Tổng giá trị" label
        expect(screen.getByText('Tổng giá trị')).toBeInTheDocument();

        // Check for total items count (small text)
        expect(screen.getByText('3 thiết bị')).toBeInTheDocument();

        // Check for available items count (small text in card)
        // There are multiple "Sẵn sàng" texts (Dashboard + Item List).
        // The one in Dashboard is a sibling of the count "1".

        // Find all "Sẵn sàng" elements
        const availableTexts = screen.getAllByText('Sẵn sàng');
        // The dashboard one is usually in a div with "Package" icon, and the card container has a specific count.

        // Check for available items count
        // The Available card has "Sẵn sàng".
        // Find the "Sẵn sàng" element that is inside a dashboard card (which is a sibling of the number).
        // Or cleaner: Find the text "Sẵn sàng", get parent, and check content.

        // The dashboard card label has a sibling div with the count.
        // We can just iterate and check if one of them has a parent with text "1"
        const dashboardLabel = availableTexts.find(el => el.closest('div')?.parentElement?.textContent?.includes('1'));
        expect(dashboardLabel).toBeTruthy();
    });

    it('filters items by searching', () => {
        render(<InventoryManager initialItems={mockItems} locations={mockLocations} />);

        const searchInput = screen.getByPlaceholderText(/Tìm kiếm tên/i);
        fireEvent.change(searchInput, { target: { value: 'iPhone' } });

        // Should show iPhone
        expect(screen.getByText('iPhone 15')).toBeInTheDocument();

        // Should NOT show MacBook Pro
        expect(screen.queryByText('MacBook Pro')).not.toBeInTheDocument();
    });

    it('filters items by status', () => {
        render(<InventoryManager initialItems={mockItems} locations={mockLocations} />);

        // Find the "Available" dashboard card to click
        // It has text "Sẵn sàng" and is a dashboard card.
        // We can find it by specific styling or order.
        // Let's iterate all "Sẵn sàng" and click the one that has a parent with 'cursor-pointer'

        const candidates = screen.getAllByText('Sẵn sàng');
        const dashboardCard = candidates.find(el => el.closest('.cursor-pointer'));

        if (dashboardCard) {
            fireEvent.click(dashboardCard);
        } else {
            // Fallback: click the text that is not in a badge
            // Badges are usually SPAN, Dashboard text is DIV
            const divText = candidates.find(el => el.tagName === 'DIV' || el.parentElement?.tagName === 'DIV');
            if (divText) fireEvent.click(divText);
        }

        // Now "MacBook Pro" (InUse) should disappear
        expect(screen.queryByText('MacBook Pro')).not.toBeInTheDocument();
        // "iPhone 15" (Available) should remain
        expect(screen.getByText('iPhone 15')).toBeInTheDocument();
    });
});
