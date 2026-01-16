import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding demo data...');

    // Ensure Locations exist
    const locations = [
        { name: 'Phòng làm việc', description: 'Bàn làm việc chính tại nhà' },
        { name: 'Ba lô đi làm', description: 'Đồ mang theo hàng ngày' },
        { name: 'Kệ sách', description: 'Nơi lưu trữ hộp và phụ kiện ít dùng' },
    ];

    for (const loc of locations) {
        await prisma.location.upsert({
            where: { name: loc.name }, // Assuming name is unique or just checking existence
            update: {},
            create: { name: loc.name, description: loc.description },
        });
    }

    // Get location IDs
    const workspace = await prisma.location.findFirst({ where: { name: 'Phòng làm việc' } });
    const backpack = await prisma.location.findFirst({ where: { name: 'Ba lô đi làm' } });
    const shelf = await prisma.location.findFirst({ where: { name: 'Kệ sách' } });

    // Items to seed
    const items = [
        {
            name: 'MacBook Pro M3 Max',
            category: 'Laptop',
            brand: 'Apple',
            type: 'Device',
            quantity: 1,
            specs: '{"CPU":"M3 Max","RAM":"36GB","Storage":"1TB"}',
            status: 'In Use',
            locationId: workspace?.id,
        },
        {
            name: 'iPhone 15 Pro Max',
            category: 'Phone',
            brand: 'Apple',
            type: 'Device',
            quantity: 1,
            specs: '{"Color":"Natural Titanium","Storage":"256GB"}',
            status: 'In Use',
            locationId: backpack?.id, // Often with user
        },
        {
            name: 'Keychron Q1 Pro',
            category: 'Keyboard',
            brand: 'Keychron',
            type: 'Accessory',
            quantity: 1,
            specs: '{"Switch":"Banana","Layout":"75%"}',
            status: 'In Use',
            locationId: workspace?.id,
        },
        {
            name: 'Logitech MX Master 3S',
            category: 'Mouse',
            brand: 'Logitech',
            type: 'Accessory',
            quantity: 1,
            specs: '{"Color":"Graphite","DPI":"8000"}',
            status: 'In Use',
            locationId: workspace?.id,
        },
        {
            name: 'Cáp Anker Thunderbolt 4',
            category: 'Cable',
            brand: 'Anker',
            type: 'Cable',
            quantity: 2,
            specs: '{"Length":"0.8m","Speed":"40Gbps"}',
            status: 'Available',
            locationId: backpack?.id,
        },
        {
            name: 'Sạc Ugreen Nexode 100W',
            category: 'Charger',
            brand: 'Ugreen',
            type: 'Accessory',
            quantity: 1,
            specs: '{"Ports":"3C1A","Power":"100W"}',
            status: 'Available',
            locationId: backpack?.id,
        },
        {
            name: 'Sony WH-1000XM5',
            category: 'Headphone',
            brand: 'Sony',
            type: 'Audio',
            quantity: 1,
            specs: '{"Color":"Silver","ANC":"True"}',
            status: 'In Use',
            locationId: shelf?.id,
        },
        {
            name: 'Hộp đựng iPhone cũ',
            category: 'Box',
            brand: 'Apple',
            type: 'Box',
            quantity: 3,
            specs: '{"Models":"iPhone X, 12, 13"}',
            status: 'Storage',
            locationId: shelf?.id,
        },
        {
            name: 'Raspberry Pi 5',
            category: 'SBC',
            brand: 'Raspberry Pi',
            type: 'Device',
            quantity: 1,
            specs: '{"RAM":"8GB"}',
            status: 'In Use',
            locationId: workspace?.id,
        }

    ];

    for (const item of items) {
        // Create new item (avoid duplicates if possible, or just create)
        // For simplicity in this demo seed, we'll check by name
        const existing = await prisma.item.findFirst({ where: { name: item.name } });
        if (!existing) {
            await prisma.item.create({
                data: {
                    ...item,
                    specs: item.specs || '{}', // Ensure valid JSON string or empty
                    buyDate: new Date(),
                }
            });
            console.log(`Created: ${item.name}`);
        } else {
            console.log(`Skipped (Exists): ${item.name}`);
        }
    }

    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
