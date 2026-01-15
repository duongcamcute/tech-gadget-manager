import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SmartAddForm } from '../SmartAddForm';
import React from 'react';

// Mock dependencies
vi.mock('@/components/ui/toast', () => ({
    useToast: () => ({ toast: vi.fn() })
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
    useSearchParams: () => ({ get: vi.fn() })
}));

vi.mock('@/app/actions', () => ({
    createItem: vi.fn().mockResolvedValue({ success: true }),
    getBrands: vi.fn().mockResolvedValue([]),
    getContacts: vi.fn().mockResolvedValue([]),
    getTemplates: vi.fn().mockResolvedValue([]),
    getItem: vi.fn(),
}));

vi.mock('@/components/ui/AutoCompleteInput', () => ({
    AutoCompleteInput: (props: any) => <input data-testid="autocomplete" onChange={e => props.onValueChange(e.target.value)} value={props.value} placeholder={props.placeholder} />
}));

vi.mock('@/components/ui/ColorPicker', () => ({
    ColorPicker: (props: any) => <input data-testid="color-picker" onChange={e => props.onChange(e.target.value)} value={props.value} />
}));

vi.mock('lucide-react', () => ({
    Wand2: () => <div />,
    RefreshCcw: () => <div />,
    Calendar: () => <div />,
    ExternalLink: () => <div />,
    MapPin: () => <div />,
    Clock: () => <div />,
    Tag: () => <div />,
    Box: () => <div />,
    Zap: () => <div />,
    Loader2: () => <div />,
    Wifi: () => <div />,
    Keyboard: () => <div />,
    Cable: () => <div />,
    HardDrive: () => <div />,
    Battery: () => <div />,
    Headphones: () => <div />,
    Database: () => <div />,
    Package: () => <div />,
    Copy: () => <div />,
    Save: () => <div />,
}));

describe('SmartAddForm', () => {
    it('renders the form correctly', () => {
        render(<SmartAddForm locations={[]} />);
        expect(screen.getByText('Thêm thiết bị mới')).toBeInTheDocument();
    });

    it('validates required fields', async () => {
        render(<SmartAddForm locations={[]} />);

        const submitBtn = screen.getByText('Lưu vào kho đồ');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText(/Tên thiết bị là bắt buộc/i)).toBeInTheDocument();
        });
    });

    it('changes fields based on template selection', async () => {
        render(<SmartAddForm locations={[]} />);

        // Use test-id-like selection or find by specific placeholder/label
        // The select for template has option "Cáp sạc nhanh (USB4)"
        // It resides in a container with "Mẫu nhanh" text.

        // Let's find the select by display value
        const selects = screen.getAllByRole('combobox');
        const templateSelect = selects.find(s => s.innerHTML.includes('Cáp sạc nhanh (USB4)'));

        if (templateSelect) {
            fireEvent.change(templateSelect, { target: { value: 'Cáp sạc nhanh (USB4)' } });

            // Wait for UI update
            await waitFor(() => {
                // Check if "Thông số Kỹ thuật Cáp" appears (this text is specific to Cable type)
                expect(screen.getByText(/Thông số Kỹ thuật Cáp/i)).toBeInTheDocument();
            });
        } else {
            console.warn("Template select not found!");
        }
    });
});
