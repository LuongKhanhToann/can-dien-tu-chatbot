// ─────────────────────────────────────────────────────────────
// Nhận diện LOẠI cân trong ảnh khách gửi.
//
// Khác với bot khách sạn (đối chiếu đúng bộ ảnh phòng), ở đây khách gửi
// ảnh một chiếc cân bất kỳ (cân họ đang dùng / muốn mua). Ta để model phân
// loại vào một trong các NHÓM cân của cửa hàng dựa trên hiểu biết chung về
// hình dạng từng loại cân — rồi map sang sản phẩm cùng loại để tư vấn.
//
// Dùng model vision riêng (gpt-4.1) cho bước này; phần chat chữ vẫn chạy
// gpt-4o-mini cho rẻ. Ảnh KHÔNG giữ trong history — chỉ kết quả (một dòng
// chữ) được đưa vào, để các lượt sau không bị tính tiền ảnh lặp lại.
// ─────────────────────────────────────────────────────────────

const VISION_MODEL = 'gpt-4.1';

// Dưới ngưỡng này bot KHÔNG khẳng định loại cân mà hỏi lại / chuyển kỹ thuật.
export const CONFIDENCE_MIN = 0.7;

// Đặc điểm nhận dạng thị giác của từng loại cân (giúp model phân loại đúng).
const CATEGORY_VISUALS = {
  retail:
    'Cân tính tiền để bàn: đĩa/mặt cân phẳng nhỏ phía trên, có cột hoặc thân đứng gắn màn hình số hiển thị KHỐI LƯỢNG, ĐƠN GIÁ và THÀNH TIỀN (thường 2 mặt hiển thị). Kích thước để trên quầy chợ/cửa hàng.',
  precision:
    'Cân tiểu ly để bàn: rất nhỏ, đĩa cân tròn hoặc vuông bằng inox nhỏ, màn hình LCD nhỏ, dùng cân vàng, thuốc, gia vị. Độ chính xác cao (0.01g–0.1g).',
  portable:
    'Cân xách tay / cầm tay mini: thiết bị nhỏ như điện thoại, có MÓC hoặc quai để móc túi/hàng lên rồi xách bằng tay, màn hình số nhỏ. Dùng cân hành lý, gà vịt, nông sản. Không có đĩa cân, không đặt trên bàn.',
  bench:
    'Cân bàn công nghiệp: mặt cân inox hình chữ nhật cỡ 30×40cm, thường có CỘT chỉ thị rời đứng bên cạnh gắn màn hình. Đặt trên bàn/kệ trong kho, cửa hàng.',
  floor:
    'Cân sàn: mặt sàn thép lớn đặt SÁT NỀN ĐẤT (thấp), hình vuông/chữ nhật ~1×1m tới 1.5m, có đầu cân chỉ thị gắn trên cột hoặc treo tường. Dùng cân pallet, bao hàng nặng trong nhà xưởng.',
  livestock:
    'Cân heo / cân gia súc: mặt sàn thấp sát đất có LỒNG/HÀNG RÀO thép quây xung quanh để nhốt con vật đứng yên khi cân, đầu cân LED trên cột. Đặt ở trang trại, chuồng trại.',
  crane:
    'Cân treo / cân móc cẩu: thân cân hình chữ nhật hoặc tròn TREO LƠ LỬNG, có MÓC ở dưới và VÒNG treo ở trên, màn hình LED đỏ to. Không có đĩa cân, hàng được móc/treo vào.',
  counting:
    'Cân đếm linh kiện: giống cân bàn nhỏ nhưng đầu cân có 3 màn hình (khối lượng / đơn trọng / số lượng). Dùng đếm ốc vít, linh kiện.',
  health:
    'Cân sức khỏe: mặt phẳng vuông sát sàn để đứng lên, thường mặt kính, màn hình nhỏ hiển thị cân nặng người. Không có cột, không có đĩa nhỏ.',
  truck:
    'Cân ô tô / trạm cân xe tải: sàn cân RẤT LỚN bằng bê tông/thép ngoài trời để cả chiếc xe tải chạy lên, có nhà cân/phòng điều khiển bên cạnh. Quy mô công trình.',
};

const RESULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    category: {
      type: 'string',
      description: 'id nhóm cân khớp nhất, hoặc "unknown" nếu không rõ / không phải cái cân.',
    },
    confidence: {
      type: 'number',
      description: 'Độ tự tin 0..1. Chỉ >= 0.8 khi ảnh rõ ràng là loại cân đó.',
    },
    reason: {
      type: 'string',
      description: 'Một câu ngắn nêu chi tiết thị giác đã dựa vào (tiếng Việt).',
    },
  },
  required: ['category', 'confidence', 'reason'],
};

function buildPrompt(categories) {
  const list = Object.keys(categories)
    .map((id) => `- ${id} — ${categories[id]}\n  Nhận dạng: ${CATEGORY_VISUALS[id]}`)
    .join('\n');

  return `Bạn xem ảnh một chiếc cân khách gửi và cho biết đó là LOẠI cân nào trong danh sách của cửa hàng cân điện tử.

Các loại cân:
${list}

Nguyên tắc:
- Dựa vào hình dạng đặc trưng (có đĩa cân nhỏ hay mặt sàn lớn, có cột chỉ thị hay màn hình gắn liền, có móc treo hay không, đặt trên bàn hay sát nền, kích thước so với môi trường xung quanh).
- Chỉ để confidence >= 0.8 khi thấy rõ đặc điểm của đúng một loại.
- Nếu ảnh mờ, không phải cái cân, hoặc là loại cân lạ không thuộc danh sách → category "unknown", confidence thấp. THÀ NHẬN KHÔNG CHẮC CÒN HƠN ĐOÁN SAI: tư vấn nhầm loại cân cho khách là lỗi nặng hơn việc hỏi lại.`;
}

// Trả { category, confidence, reason }. category có thể là 'unknown'.
export async function identifyScale(apiKey, imageDataUrl, categories) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: VISION_MODEL,
      temperature: 0,
      messages: [
        { role: 'system', content: buildPrompt(categories) },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Ảnh chiếc cân khách vừa gửi. Đây là loại cân nào?' },
            { type: 'image_url', image_url: { url: imageDataUrl, detail: 'high' } },
          ],
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'scale_match', strict: true, schema: RESULT_SCHEMA },
      },
    }),
  });

  if (!res.ok) throw new Error(`OpenAI vision ${res.status}: ${await res.text()}`);
  const data = await res.json();

  let out = { category: 'unknown', confidence: 0, reason: '' };
  try {
    out = { ...out, ...JSON.parse(data.choices[0].message.content || '{}') };
  } catch {}

  // Model có thể bịa category lạ — chỉ chấp nhận id có thật.
  if (!Object.prototype.hasOwnProperty.call(categories, out.category)) out.category = 'unknown';
  if (out.category === 'unknown') out.confidence = Math.min(out.confidence, CONFIDENCE_MIN - 0.01);

  return out;
}
