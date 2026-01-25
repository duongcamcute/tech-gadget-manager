import { redirect } from 'next/navigation';

// Trang này xử lý URL dạng /items/[id] (từ mã QR)
// Sau đó redirect về trang chủ và mở popup chi tiết bằng query param ?item=[id]
export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    redirect(`/?item=${id}`);
}
