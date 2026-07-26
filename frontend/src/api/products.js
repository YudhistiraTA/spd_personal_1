// Empty string means "same origin" — requests go to /api/v1/... on whatever
// host served the frontend, and nginx strips the /api prefix and proxies
// the rest to the backend.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 *
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<
 *  {
 *   data: {
 *       name: string,
 *       price: number,
 *       description: string,
 *       stock: number,
 *       image: string,
 *       rating: number,
 *       slug: string
 *   }[],
 *   pagination: {
 *       total: number,
 *       page: number,
 *       limit: number,
 *       totalPages: number
 *   }
 *  }
 * >}
 */
export async function getProducts(page = 1, limit = 12) {
  const res = await fetch(
    `${BASE_URL}/api/v1/products?page=${page}&limit=${limit}`,
  );
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

/**
 *
 * @param {string} slug
 * @returns {Promise<{
 *  name: string,
 *  price: number,
 *  description: string,
 *  stock: number,
 *  image: string,
 *  rating: number,
 *  slug: string
 *  reviews: {
 *      user: string,
 *      rating: number,
 *      comment: string
 *  }[]
 * }>}
 */
export async function getProductBySlug(slug) {
  const res = await fetch(
    `${BASE_URL}/api/v1/products/${encodeURIComponent(slug)}`,
  );
  if (!res.ok) {
    if (res.status === 404) throw new Error("Product not found");
    throw new Error("Failed to fetch product");
  }
  return res.json();
}
