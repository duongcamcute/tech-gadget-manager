import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // 1. Clear Database
    await prisma.itemHistory.deleteMany();
    await prisma.lendingRecord.deleteMany();
    await prisma.item.deleteMany();
    await prisma.location.deleteMany();
    console.log('Database cleared.');

    // 2. Create Locations
    const home = await prisma.location.create({ data: { name: 'Nhà', type: 'Fixed' } });
    const office = await prisma.location.create({ data: { name: 'Văn phòng', type: 'Fixed' } });

    const backpack = await prisma.location.create({
        data: { name: 'Balo Tech', type: 'Container', parentId: home.id }
    });
    const drawer = await prisma.location.create({
        data: { name: 'Ngăn kéo bàn', type: 'Fixed', parentId: office.id }
    });

    // 3. Sample Data
    const sampleItems = [
        { name: 'MacBook Pro 14"', type: 'Laptop', brand: 'Apple', model: 'M3 Pro', locationId: backpack.id, specs: JSON.stringify({ power: '96W', processor: 'M3', ram: '36GB' }), price: 45000000, color: 'Space Black' },
        { name: 'iPhone 15 Pro', type: 'Phone', brand: 'Apple', model: 'A17 Pro', locationId: backpack.id, specs: JSON.stringify({ storage: '256GB' }), price: 28000000, color: 'Titanium' },
        { name: 'Sạc Anker 737', type: 'Charger', brand: 'Anker', model: 'GaNPrime', locationId: backpack.id, specs: JSON.stringify({ power: '120W', ports: '2C1A' }), price: 1500000, color: 'Black' },
        { name: 'Cáp C-C 100W', type: 'Cable', brand: 'Ugreen', model: 'Braided', locationId: backpack.id, specs: JSON.stringify({ length: '1.5m', power: '100W' }), price: 200000, color: 'Black' },
        { name: 'AirPods Pro 2', type: 'Audio', brand: 'Apple', model: 'USB-C', locationId: backpack.id, specs: JSON.stringify({ battery: '6h' }), price: 5500000, color: 'White' },
        { name: 'Chuột MX Master 3S', type: 'Accessory', brand: 'Logitech', model: '3S', locationId: drawer.id, specs: JSON.stringify({ dpi: '8000' }), price: 2500000, color: 'Graphite' },
        { name: 'Bàn phím Keychron K6', type: 'Accessory', brand: 'Keychron', model: 'Red Switch', locationId: office.id, specs: JSON.stringify({ layout: '65%' }), price: 1800000, color: 'Black' },
        { name: 'Sạc dự phòng 20k', type: 'PowerBank', brand: 'Xiaomi', model: 'Gen 3', locationId: backpack.id, specs: JSON.stringify({ capacity: '20000mAh', power: '50W' }), price: 800000, color: 'Blue' },
        { name: 'Đèn màn hình', type: 'SmartHome', brand: 'Baseus', locationId: office.id, price: 600000, color: 'Black' },
        { name: 'Lọc không khí', type: 'SmartHome', brand: 'Xiaomi', model: '4 Lite', locationId: home.id, price: 2500000, color: 'White' },
        { name: 'iPad Air 5', type: 'Tablet', brand: 'Apple', model: 'M1', locationId: home.id, specs: JSON.stringify({ storage: '64GB' }), price: 14000000, color: 'Blue' },
        { name: 'Apple Pencil 2', type: 'Accessory', brand: 'Apple', locationId: home.id, price: 3000000, color: 'White' },
        { name: 'Dây HDMI 2.1', type: 'Cable', brand: 'Ugreen', locationId: drawer.id, specs: JSON.stringify({ length: '2m', bandwidth: '48Gbps' }), price: 350000, color: 'Black' },
        { name: 'Ổ cứng SSD 1TB', type: 'Storage', brand: 'Samsung', model: 'T7', locationId: backpack.id, specs: JSON.stringify({ capacity: '1TB', speed: '1050MB/s' }), price: 3200000, color: 'Red' },
        { name: 'Thẻ nhớ SD 128GB', type: 'Storage', brand: 'SanDisk', model: 'Extreme Pro', locationId: backpack.id, specs: JSON.stringify({ capacity: '128GB' }), price: 800000, color: 'Black' },
        { name: 'Hub USB-C', type: 'Accessory', brand: 'HyperDrive', model: '6-in-1', locationId: backpack.id, price: 1200000, color: 'Grey' },
        { name: 'Loa Bluetooth', type: 'Audio', brand: 'JBL', model: 'Flip 6', locationId: home.id, price: 2800000, color: 'Blue' },
        { name: 'Đồng hồ Garmin', type: 'Wearable', brand: 'Garmin', model: 'Forerunner 265', locationId: null, price: 11000000, color: 'Black/Yellow' },
        { name: 'Kindle Paperwhite', type: 'Tablet', brand: 'Amazon', model: 'Gen 11', locationId: home.id, price: 3500000, color: 'Black' },
        { name: 'Đèn ngủ thông minh', type: 'SmartHome', brand: 'Yeelight', locationId: home.id, price: 400000, color: 'White' }
    ];

    for (const item of sampleItems) {
        await prisma.item.create({
            data: {
                name: item.name,
                type: item.type,
                category: item.type,
                brand: item.brand,
                model: item.model,
                locationId: item.locationId,
                specs: item.specs || '{}',
                status: 'Available',
                purchasePrice: item.price,
                color: item.color,
                purchaseDate: new Date(),
                purchaseLocation: 'Shopee Mall'
            }
        });
    }

    console.log(`Seeding finished. Created ${sampleItems.length} items.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
