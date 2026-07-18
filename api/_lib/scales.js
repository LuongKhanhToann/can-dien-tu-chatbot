// ─────────────────────────────────────────────────────────────
// Logic bán cân điện tử dùng chung cho các serverless function (Vercel).
// Chạy ở region US (mặc định iad1) nên gọi OpenAI không bị chặn VN.
//
// "Database": danh mục sản phẩm cân điện tử + đơn báo giá mẫu.
// Đơn/báo giá mới lưu in-memory (demo). Nối DB thật thì thay các hàm cuối.
// ─────────────────────────────────────────────────────────────

import { identifyScale, CONFIDENCE_MIN } from './vision.js';
import { notifyAdmin } from './notify.js';

export const SHOP = {
  name: 'Cân Điện Tử Đại Tín',
  tagline: 'Nhập khẩu & phân phối cân điện tử — Giá xuất xưởng',
  hotline: '1800 6789',
  zalo: '0909 168 246',
  warranty: 'Bảo hành 12–24 tháng, kiểm định tem chì hợp pháp, giao hàng toàn quốc.',
  branches: [
    { name: 'Kho HCM', addr: '25 Đường số 7, KCN Tân Bình, Q. Tân Phú, TP.HCM' },
    { name: 'Kho Hà Nội', addr: '188 Nguyễn Xiển, Thanh Xuân, Hà Nội' },
  ],
};

// Nhóm loại cân — dùng cho tư vấn & nhận diện ảnh.
export const CATEGORIES = {
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

// price = null  → "Liên hệ báo giá" (khảo sát/lắp đặt).
export const PRODUCTS = [
  {
    id: 'can-tinh-gia', name: 'Cân điện tử tính giá bán hàng', model: 'AS-888-B2',
    category: 'retail', price: 650000, capacity: '30kg', division: '2g – 10g',
    image: 'assets/products/retail.svg', stock: 120, promo: 'Đang khuyến mãi',
    desc: 'Cân tính tiền cho cửa hàng thịt, hoa quả, thực phẩm sạch, siêu thị mini — nhập đơn giá tự tính thành tiền, cộng dồn đơn hàng, trừ bì, hiển thị 2 mặt trước–sau.',
    features: ['Tính tiền nhanh', 'Cộng dồn đơn hàng', 'Trừ bì tiện lợi', 'Màn hình 2 mặt'],
  },
  {
    id: 'can-tieu-ly-500', name: 'Cân tiểu ly điện tử 500g', model: 'PJ-500',
    category: 'precision', price: 220000, capacity: '500g', division: '0.01g',
    image: 'assets/products/precision.svg', stock: 200,
    desc: 'Cân vàng bạc, đá quý, thuốc, gia vị, phòng lab — độ chính xác cao tới 0,01g, đĩa cân inox.',
    features: ['Độ chia 0.01g', 'Đĩa inox', 'Chức năng đếm', 'Trừ bì (Tare)'],
  },
  {
    id: 'can-xach-tay', name: 'Cân xách tay điện tử mini 75kg', model: 'OCS-75-Mini',
    category: 'portable', price: 90000, capacity: '75kg', division: '50g',
    image: 'assets/products/portable.svg', stock: 500,
    desc: 'Cân cầm tay nhỏ gọn cân hành lý, nông sản, gà vịt — bỏ túi mang theo mọi chuyến đi, tránh quá cân ký gửi sân bay. Vỏ nhựa ABS siêu bền.',
    features: ['Tải tới 75kg', 'Vỏ ABS siêu bền', 'Nhỏ gọn bỏ túi', 'Chốt số (Hold)'],
  },
  {
    id: 'can-ban-60', name: 'Cân bàn điện tử 60kg', model: 'JW-60',
    category: 'bench', price: 1150000, capacity: '60kg', division: '5g – 10g',
    image: 'assets/products/bench.svg', stock: 60,
    desc: 'Cân bàn mặt inox 30×40cm cho kho, cửa hàng, nông sản — chắc chắn, cột chỉ thị rời tiện đọc số.',
    features: ['Mặt inox 30×40cm', 'Cột chỉ thị rời', 'Trừ bì / cộng dồn', 'Sạc + pin'],
  },
  {
    id: 'can-ban-150', name: 'Cân bàn điện tử 150kg', model: 'A12-150',
    category: 'bench', price: 1750000, capacity: '150kg', division: '10g – 20g',
    image: 'assets/products/bench.svg', stock: 45,
    desc: 'Cân bàn tải nặng 150kg cho kho hàng, xưởng nhỏ, vựa nông sản — khung thép sơn tĩnh điện.',
    features: ['Tải 150kg', 'Khung thép chịu lực', 'Đầu cân A12', 'Cộng dồn / đếm'],
  },
  {
    id: 'can-dem-30', name: 'Cân đếm điện tử 30kg', model: 'JCE-30',
    category: 'counting', price: 1550000, capacity: '30kg', division: '1g',
    image: 'assets/products/counting.svg', stock: 40,
    desc: 'Cân đếm linh kiện, ốc vít, sản xuất — đếm số lượng theo khối lượng mẫu, 3 màn hình (khối lượng / đơn trọng / số lượng).',
    features: ['3 màn hình LCD', 'Đếm theo mẫu', 'Trọng lượng mẫu nhỏ', 'Kết nối PC'],
  },
  {
    id: 'can-san-500', name: 'Cân sàn điện tử 500kg', model: 'FS-1010-500',
    category: 'floor', price: 3700000, capacity: '500kg', division: '100g',
    image: 'assets/products/floor.svg', stock: 25,
    desc: 'Cân sàn 1.0×1.0m cho nhà xưởng, kho vận — 4 loadcell hợp kim, mặt gằn chống trượt, có bánh xe tuỳ chọn.',
    features: ['Sàn 1.0×1.0m', '4 loadcell', 'Mặt gằn chống trượt', 'In phiếu cân (tuỳ chọn)'],
  },
  {
    id: 'can-san-2000', name: 'Cân sàn điện tử 2 tấn', model: 'FS-1215-2T',
    category: 'floor', price: 6400000, capacity: '2000kg', division: '500g',
    image: 'assets/products/floor.svg', stock: 12,
    desc: 'Cân sàn 1.2×1.5m tải 2 tấn cho công nghiệp nặng, logistics — loadcell chống nước, khung dày.',
    features: ['Sàn 1.2×1.5m', 'Tải 2 tấn', 'Loadcell chống nước', 'Kết nối máy in / PC'],
  },
  {
    id: 'can-heo-500', name: 'Cân heo / gia súc điện tử 500kg', model: 'DH-500',
    category: 'livestock', price: 2600000, capacity: '500kg', division: '100g',
    image: 'assets/products/livestock.svg', stock: 35,
    desc: 'Cân heo cho hộ chăn nuôi, trang trại — khung thép cực khỏe có lồng chắn, chức năng CHỐT SỐ (Hold) đọc kết quả dễ khi heo di chuyển, màn LED số to.',
    features: ['Tải 300–500kg', 'Khung thép có lồng', 'Chốt số (Hold)', 'LED số to'],
  },
  {
    id: 'can-treo-1000', name: 'Cân treo điện tử OCS inox 304 chống nước', model: 'OCS-1T',
    category: 'crane', price: 2300000, capacity: '1 – 10 tấn', division: '500g',
    image: 'assets/products/crane.svg', stock: 30,
    desc: 'Cân treo móc cẩu vỏ inox 304 chống nước, chống gỉ — cho nhà máy, bến cảng, lò mổ, thủy hải sản, môi trường ẩm ướt. Có điều khiển từ xa, tải 1–10 tấn.',
    features: ['Vỏ inox 304 chống nước', 'Tải 1–10 tấn', 'Móc xoay 360°', 'Điều khiển từ xa'],
  },
  {
    id: 'can-suc-khoe', name: 'Cân sức khỏe điện tử 180kg', model: 'BS-180',
    category: 'health', price: 160000, capacity: '180kg', division: '100g',
    image: 'assets/products/health.svg', stock: 300,
    desc: 'Cân sức khỏe mặt kính cường lực cho gia đình, phòng khám, phòng gym — tự bật khi bước lên.',
    features: ['Mặt kính cường lực', 'Tự bật (step-on)', 'Tải 180kg', 'Pin CR2032'],
  },
  {
    id: 'can-o-to', name: 'Cân ô tô điện tử (trạm cân xe tải)', model: 'Weighbridge 40–120T',
    category: 'truck', price: null, capacity: '40 – 120 tấn', division: '10 – 20kg',
    image: 'assets/products/truck.svg', stock: null,
    desc: 'Trạm cân xe tải 40–120 tấn — khảo sát mặt bằng, thi công móng, lắp đặt & kiểm định trọn gói. Bên em cử kỹ thuật khảo sát tận nơi.',
    features: ['Tải 40–120 tấn', 'Loadcell chịu lực cao', 'Phần mềm quản lý cân', 'Khảo sát & lắp đặt'],
  },
];

// Đơn/báo giá mẫu (để phần "đơn gần đây" trông thật, demo).
const SEED_QUOTES = [];
const quotes = [...SEED_QUOTES];

const money = (n) => (n || 0).toLocaleString('vi-VN') + 'đ';

function findProduct(idOrName) {
  const q = String(idOrName || '').toLowerCase();
  return (
    PRODUCTS.find((p) => p.id === idOrName) ||
    PRODUCTS.find((p) => p.model.toLowerCase() === q) ||
    PRODUCTS.find((p) => p.name.toLowerCase().includes(q))
  );
}

// Chuẩn hoá 1 sản phẩm thành "thẻ" cho frontend hiển thị.
function toCard(p) {
  return {
    id: p.id, name: p.name, model: p.model, category: p.category,
    catLabel: CATEGORIES[p.category], price: p.price, capacity: p.capacity,
    division: p.division, image: p.image, features: p.features,
    inStock: p.stock === null ? true : p.stock > 0,
  };
}

// Tìm sản phẩm phù hợp. Ưu tiên product_ids (khi model đã chốt sản phẩm cụ thể),
// nếu không thì lọc theo category / ngân sách.
export function findProducts({ product_ids, category, budget_max } = {}) {
  let list = PRODUCTS;
  if (Array.isArray(product_ids) && product_ids.length) {
    const want = new Set(product_ids);
    list = PRODUCTS.filter((p) => want.has(p.id));
  } else {
    if (category) list = list.filter((p) => p.category === category);
    if (budget_max) list = list.filter((p) => p.price != null && p.price <= budget_max);
  }
  return { shop: SHOP.name, count: list.length, products: list.map(toCard) };
}

export function getProductDetails({ product_id }) {
  const p = findProduct(product_id);
  return p ? { ...toCard(p), desc: p.desc, stock: p.stock } : { error: 'Không tìm thấy sản phẩm này.' };
}

// Tạo yêu cầu báo giá / đặt hàng. Có giá sỉ khi số lượng lớn (demo).
export function createQuote({ product_id, quantity = 1, customer_name, phone, note }) {
  const p = findProduct(product_id);
  if (!p) return { error: 'Không tìm thấy sản phẩm để báo giá.' };
  const code = 'DT' + Math.random().toString(36).slice(2, 6).toUpperCase() + Math.floor(Math.random() * 90 + 10);

  // Sản phẩm cần khảo sát (cân ô tô) — không có giá niêm yết.
  if (p.price == null) {
    quotes.push({ code, product_id: p.id, quantity, customer_name, phone, kind: 'survey' });
    return {
      status: 'received', kind: 'survey', code, product: p.name, model: p.model,
      quantity, customer_name: customer_name || 'Quý khách', phone: phone || '(chưa cung cấp)',
      note: 'Yêu cầu khảo sát đã ghi nhận — kỹ thuật sẽ liên hệ hẹn lịch khảo sát tận nơi.',
    };
  }

  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  // Giá sỉ demo: >=10 cái bớt 10%, >=5 cái bớt 5%.
  const discountRate = qty >= 10 ? 0.1 : qty >= 5 ? 0.05 : 0;
  const unit = Math.round(p.price * (1 - discountRate));
  const total = unit * qty;

  quotes.push({ code, product_id: p.id, quantity: qty, customer_name, phone, kind: 'order' });
  return {
    status: 'confirmed', kind: 'order', code, product: p.name, model: p.model,
    image: p.image, quantity: qty, listPrice: p.price, unitPrice: unit, total,
    discountRate, discountLabel: discountRate ? `Giá sỉ -${discountRate * 100}%` : null,
    customer_name: customer_name || 'Quý khách', phone: phone || '(chưa cung cấp)',
    note: note || '',
    footer: 'Đơn demo — đã ghi nhận. Nhân viên kinh doanh sẽ gọi xác nhận & chốt vận chuyển.',
  };
}

// ── LLM (Google Gemini 2.5 Flash) ───────────────────────────────
const MODEL = 'gemini-2.5-flash';

export function escalateToHuman({ reason, question }) {
  return { escalated: true, reason: reason || 'Bot chưa đủ chắc để trả lời.', question: question || '' };
}

const CATALOG = PRODUCTS.map(
  (p) => `- ${p.id} — ${p.name} (${p.model}) — ${CATEGORIES[p.category]} — ${p.price == null ? 'Liên hệ báo giá' : money(p.price)} — tải ${p.capacity}, độ chia ${p.division}`
).join('\n');

const SYSTEM_PROMPT = `Bạn là nhân viên tư vấn bán hàng của "${SHOP.name}" — ${SHOP.tagline}. Bạn hỗ trợ khách qua tin nhắn (giống fanpage Facebook/Messenger) bằng tiếng Việt tự nhiên, thân thiện, nhiệt tình nhưng gọn gàng, đúng chất nhân viên sale thật.

Bên mình NHẬP KHẨU trực tiếp và PHÂN PHỐI cân điện tử với GIÁ XUẤT XƯỞNG (rẻ hơn mua qua đại lý). ${SHOP.warranty}
Kho: ${SHOP.branches.map((b) => `${b.name} — ${b.addr}`).join(' | ')}. Hotline ${SHOP.hotline}, Zalo ${SHOP.zalo}.

Danh mục sản phẩm (id — tên (model) — loại — giá xuất xưởng — tải/độ chia):
${CATALOG}

Nhiệm vụ:
- Hỏi rõ nhu cầu để tư vấn ĐÚNG loại cân: khách cân gì, khối lượng tối đa bao nhiêu, dùng ở đâu (chợ/cửa hàng, kho, xưởng, cân vàng, cân xe tải...), ngân sách.
- Khi khách hỏi sản phẩm / giá / gợi ý, LUÔN gọi tool find_products để hiển thị đúng sản phẩm — đừng bịa giá.
- Khi khách muốn xem kỹ 1 sản phẩm, gọi get_product_details.
- Khi khách chốt mua (hoặc muốn báo giá sỉ): thu thập tên + số điện thoại + sản phẩm + số lượng rồi gọi create_quote. Thiếu thì hỏi cho đủ. Nhấn mạnh giá xuất xưởng, mua số lượng nhiều có giá sỉ tốt hơn.
- Cân ô tô (trạm cân xe tải) không có giá niêm yết: cần khảo sát tận nơi — xin địa chỉ + SĐT rồi tạo yêu cầu khảo sát qua create_quote.
- Báo giá rõ ràng, đơn vị VND (vd 1.150.000đ). Khi báo tổng: đơn giá × số lượng = tổng.

Chọn sản phẩm để hiển thị (QUAN TRỌNG):
- Hệ thống chỉ hiện thẻ sản phẩm cho đúng những gì find_products trả về. Hãy để kết quả tool khớp với điều bạn đang nói.
- Khi đã xác định được loại/sản phẩm cụ thể, truyền product_ids gồm đúng id phù hợp — đừng đổ cả danh mục khi khách chỉ hỏi một loại.
- Khách hỏi chung ("bên em có những loại cân nào") thì mới để trống để hiện nhiều lựa chọn.
- Ví dụ: khách bán thịt/rau ngoài chợ cần cân tính tiền → product_ids ["can-tinh-gia"]. Khách cân vàng → ["can-tieu-ly-500"]. Khách cân hàng kho 100kg → ["can-ban-150","can-san-500"]. Khách nuôi heo → ["can-heo-500"]. Khách cân hành lý đi máy bay → ["can-xach-tay"].

Khi khách gửi ẢNH một chiếc cân:
- Hệ thống đã nhận diện loại cân trong ảnh và báo lại cho bạn kèm độ tin cậy. Bạn KHÔNG nhìn thấy ảnh, chỉ dựa vào kết quả đó.
- Nếu nhận ra loại cân: xác nhận với khách ("Ảnh này là loại ... đúng không ạ"), rồi gọi find_products với đúng sản phẩm cùng loại để tư vấn mẫu tương đương + báo giá xuất xưởng.
- Nếu hệ thống báo KHÔNG chắc: đừng đoán bừa. Hỏi lại khách (cân để làm gì, tải bao nhiêu kg) và cho biết đã nhờ kỹ thuật xem giúp.

Khi không chắc chắn:
- Gặp câu hỏi ngoài dữ liệu (chính sách lạ, thông số kỹ thuật đặc biệt, khiếu nại, giá không có trong danh mục...) thì TUYỆT ĐỐI không bịa. Gọi escalate_to_human để chuyển nhân viên, rồi báo khách sẽ có người liên hệ ngay.

Phong cách:
- Nói như nhân viên sale fanpage thật, thân thiện, nhiệt tình, ngắn gọn, đi thẳng vào việc. Xưng "em", gọi khách "anh/chị". Emoji dùng vừa phải (tối đa 1–2 cái mỗi tin), đừng spam, đừng sáo rỗng.
- Nếu tool đã trả kết quả, hệ thống tự hiện thẻ sản phẩm kèm hình — bạn chỉ tóm tắt gợi ý & giá trong 1–2 câu và mời khách chốt/để lại SĐT.`;

const CATEGORY_ENUM = Object.keys(CATEGORIES);
const PRODUCT_ENUM = PRODUCTS.map((p) => p.id);

const TOOLS = [
  { type: 'function', function: { name: 'find_products', description: 'Tìm & hiển thị sản phẩm cân phù hợp. Truyền product_ids khi đã chốt sản phẩm cụ thể để chỉ hiện đúng sản phẩm đó.', parameters: { type: 'object', properties: { product_ids: { type: 'array', items: { type: 'string', enum: PRODUCT_ENUM }, description: 'Chỉ hiển thị đúng các sản phẩm này (id).' }, category: { type: 'string', enum: CATEGORY_ENUM, description: 'Lọc theo loại cân.' }, budget_max: { type: 'integer', description: 'Ngân sách tối đa (VND).' } } } } },
  { type: 'function', function: { name: 'get_product_details', description: 'Xem chi tiết đầy đủ 1 sản phẩm cân.', parameters: { type: 'object', properties: { product_id: { type: 'string', enum: PRODUCT_ENUM } }, required: ['product_id'] } } },
  { type: 'function', function: { name: 'create_quote', description: 'Tạo báo giá / đặt hàng khi khách đã chốt. Với cân ô tô là tạo yêu cầu khảo sát.', parameters: { type: 'object', properties: { product_id: { type: 'string', enum: PRODUCT_ENUM }, quantity: { type: 'integer', default: 1 }, customer_name: { type: 'string' }, phone: { type: 'string' }, note: { type: 'string' } }, required: ['product_id', 'customer_name', 'phone'] } } },
  { type: 'function', function: { name: 'escalate_to_human', description: 'Gọi khi KHÔNG đủ chắc để trả lời (ngoài dữ liệu, thông số đặc biệt, khiếu nại, yêu cầu lạ). Hệ thống sẽ báo nhân viên. Đừng bịa.', parameters: { type: 'object', properties: { reason: { type: 'string' }, question: { type: 'string' } }, required: ['reason'] } } },
];

function runTool(name, args) {
  if (name === 'find_products') return findProducts(args);
  if (name === 'get_product_details') return getProductDetails(args);
  if (name === 'create_quote') return createQuote(args);
  if (name === 'escalate_to_human') return escalateToHuman(args);
  return { error: 'unknown tool' };
}

// Chuyển JSON-schema kiểu OpenAI (type thường, có default/additionalProperties)
// sang Schema mà Gemini chấp nhận: type IN HOA, bỏ các khoá không hỗ trợ.
export function toGeminiSchema(s) {
  if (!s || typeof s !== 'object') return s;
  const out = {};
  if (s.type) out.type = String(s.type).toUpperCase();
  if (s.description) out.description = s.description;
  if (s.enum) out.enum = s.enum;
  if (s.format) out.format = s.format;
  if (s.items) out.items = toGeminiSchema(s.items);
  if (s.properties) {
    out.properties = {};
    for (const [k, v] of Object.entries(s.properties)) out.properties[k] = toGeminiSchema(v);
  }
  if (Array.isArray(s.required) && s.required.length) out.required = s.required;
  return out;
}

// Khai báo tool cho Gemini: gom function declarations, chuyển schema tham số.
const GEMINI_TOOLS = [
  {
    functionDeclarations: TOOLS.map((t) => ({
      name: t.function.name,
      description: t.function.description,
      parameters: toGeminiSchema(t.function.parameters),
    })),
  },
];

// Gọi Gemini generateContent. systemText = chỉ dẫn hệ thống, contents = hội thoại
// theo định dạng Gemini ({ role: 'user'|'model', parts: [...] }).
async function callGemini(apiKey, systemText, contents, useTools = true) {
  const body = {
    systemInstruction: { parts: [{ text: systemText }] },
    contents,
    generationConfig: { temperature: 0.5 },
  };
  if (useTools) {
    body.tools = GEMINI_TOOLS;
    body.toolConfig = { functionCallingConfig: { mode: 'AUTO' } };
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  return res.json();
}

// Nhận diện loại cân trong ảnh khách gửi rồi biến thành MỘT DÒNG CHỮ đưa vào
// hội thoại. Ảnh không đi vào history nên các lượt sau không bị tính tiền ảnh lại.
async function describeGuestImage(apiKey, image, lastText) {
  const match = await identifyScale(apiKey, image, CATEGORIES);
  const catLabel = CATEGORIES[match.category];
  const confident = !!catLabel && match.confidence >= CONFIDENCE_MIN;

  if (!confident) {
    await notifyAdmin({
      reason: `Không nhận diện chắc loại cân trong ảnh khách gửi (độ tin cậy ${match.confidence.toFixed(2)}).`,
      guestMessage: lastText,
      detail: match.reason,
    });
    return {
      note: `Khách vừa gửi một ảnh chiếc cân. Hệ thống KHÔNG chắc đây là loại cân nào (độ tin cậy ${match.confidence.toFixed(2)}, dưới ngưỡng ${CONFIDENCE_MIN}). Đừng đoán bừa. Hãy hỏi lại khách (cân để làm gì, tải tối đa bao nhiêu kg) và cho biết đã nhờ kỹ thuật xem giúp.`,
      handoff: { reason: 'Không nhận diện được loại cân trong ảnh', confidence: match.confidence },
      vision: match,
    };
  }

  const sameType = PRODUCTS.filter((p) => p.category === match.category).map((p) => p.id);
  return {
    note: `Khách vừa gửi ảnh một chiếc cân. Hệ thống nhận diện: ${catLabel} (category: ${match.category}), độ tin cậy ${match.confidence.toFixed(2)}. Căn cứ: ${match.reason}. Hãy xác nhận loại cân với khách một câu, rồi gọi find_products với product_ids ${JSON.stringify(sameType)} để tư vấn mẫu tương đương và báo giá xuất xưởng.`,
    handoff: null,
    vision: match,
  };
}

function partsText(parts) {
  return (parts || []).filter((p) => p.text).map((p) => p.text).join('').trim();
}

// Chạy agent loop (Gemini), trả { reply, cards, order, handoff, vision }.
export async function runChat(apiKey, history, today, image) {
  let systemText = `${SYSTEM_PROMPT}\n\nNgày hôm nay (tham chiếu): ${today}.`;
  const cards = [];
  let order = null;
  let handoff = null;
  let vision = null;

  if (image) {
    const lastText = [...history].reverse().find((m) => m.role === 'user')?.content || '';
    const seen = await describeGuestImage(apiKey, image, lastText);
    // Gemini chỉ có 1 systemInstruction — đưa kết quả nhận diện ảnh vào đó.
    systemText += `\n\n[Hệ thống vừa nhận diện ảnh khách gửi] ${seen.note}`;
    handoff = seen.handoff;
    vision = seen.vision;
  }

  const lastUserText = [...history].reverse().find((m) => m.role === 'user')?.content || '';

  // Chuyển history sang định dạng Gemini: role 'user'|'model', parts:[{text}].
  const contents = history.slice(-16).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content || '' }],
  }));

  for (let step = 0; step < 4; step++) {
    const data = await callGemini(apiKey, systemText, contents, true);
    const cand = data.candidates && data.candidates[0];
    const parts = (cand && cand.content && cand.content.parts) || [];
    const calls = parts.filter((p) => p.functionCall).map((p) => p.functionCall);

    if (!calls.length) {
      return { reply: partsText(parts), cards, order, handoff, vision };
    }

    // Ghi lại lượt model (chứa functionCall), rồi gửi kết quả tool trở lại.
    contents.push({ role: 'model', parts });
    const responseParts = [];
    for (const call of calls) {
      const args = call.args || {};
      const result = runTool(call.name, args);
      if (call.name === 'find_products' && result.products) {
        for (const p of result.products) if (!cards.find((c) => c.id === p.id)) cards.push(p);
      }
      if (call.name === 'get_product_details' && !result.error && !cards.find((c) => c.id === result.id)) {
        cards.push(result);
      }
      if (call.name === 'create_quote' && (result.status === 'confirmed' || result.status === 'received')) order = result;
      if (call.name === 'escalate_to_human') {
        handoff = { reason: result.reason, confidence: null };
        await notifyAdmin({ reason: result.reason, guestMessage: args.question || lastUserText });
      }
      responseParts.push({ functionResponse: { name: call.name, response: result } });
    }
    contents.push({ role: 'user', parts: responseParts });
  }

  // Hết vòng tool mà chưa có câu trả lời → ép Gemini chốt bằng văn bản.
  const final = await callGemini(
    apiKey,
    `${systemText}\n\nBây giờ hãy trả lời khách bằng văn bản, KHÔNG gọi thêm tool.`,
    contents,
    false
  );
  const fparts = (final.candidates && final.candidates[0] && final.candidates[0].content && final.candidates[0].content.parts) || [];
  return { reply: partsText(fparts) || 'Em cần thêm chút thông tin ạ.', cards, order, handoff, vision };
}
