import { findProducts } from './_lib/scales.js';

// Danh mục sản phẩm cho tab "Sản phẩm" (gian hàng). Có thể lọc theo ?category=.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const category = req.query.category || undefined;
  const data = findProducts({ category });
  return res.status(200).json(data);
}
