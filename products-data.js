// Danh mục sản phẩm tĩnh cho tab "Sản phẩm" (khớp PRODUCTS trong api/_lib/scales.js).
// Tab vẽ ngay từ đây để luôn có nội dung; số/giá realtime lấy thêm từ /api/products.
window.CATEGORIES_DATA = {
  retail: 'Cân tính giá bán hàng',
  precision: 'Cân tiểu ly / phân tích',
  portable: 'Cân xách tay / cầm tay mini',
  bench: 'Cân bàn điện tử',
  counting: 'Cân đếm điện tử',
  floor: 'Cân sàn điện tử',
  livestock: 'Cân gia súc (cân heo)',
  crane: 'Cân treo điện tử',
  health: 'Cân sức khỏe điện tử',
  truck: 'Cân ô tô / trạm cân xe tải',
};

window.PRODUCTS_DATA = [
  { id: 'can-tinh-gia', name: 'Cân điện tử tính giá bán hàng', model: 'AS-888-B2', category: 'retail', price: 650000, capacity: '30kg', division: '2g – 10g', image: 'assets/products/retail.svg', promo: 'Đang khuyến mãi', desc: 'Cân tính tiền cho cửa hàng thịt, hoa quả, thực phẩm sạch, siêu thị mini — cộng dồn đơn, trừ bì, hiển thị 2 mặt.', features: ['Tính tiền nhanh', 'Cộng dồn đơn hàng', 'Trừ bì tiện lợi', 'Màn hình 2 mặt'] },
  { id: 'can-tieu-ly-500', name: 'Cân tiểu ly điện tử 500g', model: 'PJ-500', category: 'precision', price: 220000, capacity: '500g', division: '0.01g', image: 'assets/products/precision.svg', desc: 'Cân vàng bạc, đá quý, thuốc, gia vị, phòng lab — chính xác tới 0,01g, đĩa inox.', features: ['Độ chia 0.01g', 'Đĩa inox', 'Chức năng đếm', 'Trừ bì (Tare)'] },
  { id: 'can-xach-tay', name: 'Cân xách tay điện tử mini 75kg', model: 'OCS-75-Mini', category: 'portable', price: 90000, capacity: '75kg', division: '50g', image: 'assets/products/portable.svg', desc: 'Cân cầm tay nhỏ gọn cân hành lý, nông sản, gà vịt — bỏ túi mang theo, tránh quá cân sân bay.', features: ['Tải tới 75kg', 'Vỏ ABS siêu bền', 'Nhỏ gọn bỏ túi', 'Chốt số (Hold)'] },
  { id: 'can-ban-60', name: 'Cân bàn điện tử 60kg', model: 'JW-60', category: 'bench', price: 1150000, capacity: '60kg', division: '5g – 10g', image: 'assets/products/bench.svg', desc: 'Cân bàn mặt inox 30×40cm cho kho, cửa hàng, nông sản — cột chỉ thị rời tiện đọc số.', features: ['Mặt inox 30×40cm', 'Cột chỉ thị rời', 'Trừ bì / cộng dồn', 'Sạc + pin'] },
  { id: 'can-ban-150', name: 'Cân bàn điện tử 150kg', model: 'A12-150', category: 'bench', price: 1750000, capacity: '150kg', division: '10g – 20g', image: 'assets/products/bench.svg', desc: 'Cân bàn tải nặng 150kg cho kho hàng, xưởng nhỏ, vựa nông sản — khung thép sơn tĩnh điện.', features: ['Tải 150kg', 'Khung thép chịu lực', 'Đầu cân A12', 'Cộng dồn / đếm'] },
  { id: 'can-dem-30', name: 'Cân đếm điện tử 30kg', model: 'JCE-30', category: 'counting', price: 1550000, capacity: '30kg', division: '1g', image: 'assets/products/counting.svg', desc: 'Cân đếm linh kiện, ốc vít, sản xuất — đếm theo khối lượng mẫu, 3 màn hình.', features: ['3 màn hình LCD', 'Đếm theo mẫu', 'Trọng lượng mẫu nhỏ', 'Kết nối PC'] },
  { id: 'can-san-500', name: 'Cân sàn điện tử 500kg', model: 'FS-1010-500', category: 'floor', price: 3700000, capacity: '500kg', division: '100g', image: 'assets/products/floor.svg', desc: 'Cân sàn 1.0×1.0m cho nhà xưởng, kho vận — 4 loadcell, mặt gằn chống trượt.', features: ['Sàn 1.0×1.0m', '4 loadcell', 'Mặt gằn chống trượt', 'In phiếu cân (tuỳ chọn)'] },
  { id: 'can-san-2000', name: 'Cân sàn điện tử 2 tấn', model: 'FS-1215-2T', category: 'floor', price: 6400000, capacity: '2000kg', division: '500g', image: 'assets/products/floor.svg', desc: 'Cân sàn 1.2×1.5m tải 2 tấn cho công nghiệp nặng, logistics — loadcell chống nước.', features: ['Sàn 1.2×1.5m', 'Tải 2 tấn', 'Loadcell chống nước', 'Kết nối máy in / PC'] },
  { id: 'can-heo-500', name: 'Cân heo / gia súc điện tử 500kg', model: 'DH-500', category: 'livestock', price: 2600000, capacity: '500kg', division: '100g', image: 'assets/products/livestock.svg', desc: 'Cân heo cho hộ chăn nuôi, trang trại — khung thép có lồng, chốt số (Hold), LED số to.', features: ['Tải 300–500kg', 'Khung thép có lồng', 'Chốt số (Hold)', 'LED số to'] },
  { id: 'can-treo-1000', name: 'Cân treo điện tử OCS inox 304 chống nước', model: 'OCS-1T', category: 'crane', price: 2300000, capacity: '1 – 10 tấn', division: '500g', image: 'assets/products/crane.svg', desc: 'Cân treo móc cẩu vỏ inox 304 chống nước — cho nhà máy, bến cảng, lò mổ, thủy hải sản. Remote từ xa.', features: ['Vỏ inox 304 chống nước', 'Tải 1–10 tấn', 'Móc xoay 360°', 'Điều khiển từ xa'] },
  { id: 'can-suc-khoe', name: 'Cân sức khỏe điện tử 180kg', model: 'BS-180', category: 'health', price: 160000, capacity: '180kg', division: '100g', image: 'assets/products/health.svg', desc: 'Cân sức khỏe mặt kính cường lực cho gia đình, phòng khám, phòng gym — tự bật khi bước lên.', features: ['Mặt kính cường lực', 'Tự bật (step-on)', 'Tải 180kg', 'Pin CR2032'] },
  { id: 'can-o-to', name: 'Cân ô tô điện tử (trạm cân xe tải)', model: 'Weighbridge 40–120T', category: 'truck', price: null, capacity: '40 – 120 tấn', division: '10 – 20kg', image: 'assets/products/truck.svg', desc: 'Trạm cân xe tải 40–120 tấn — khảo sát, thi công móng, lắp đặt & kiểm định trọn gói.', features: ['Tải 40–120 tấn', 'Loadcell chịu lực cao', 'Phần mềm quản lý cân', 'Khảo sát & lắp đặt'] },
];
