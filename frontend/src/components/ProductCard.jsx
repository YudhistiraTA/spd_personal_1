import { Link } from "react-router-dom";

/**
 *
 * @param {{ product: { name: string, price: number, description: string, stock: number, image: string, rating: number, slug: string } }} param0
 * @returns {JSX.Element}
 */
export default function ProductCard({ product }) {
  const stockClass =
    product.stock === 0 ? 'out-of-stock' :
    product.stock <= 5  ? 'low-stock'    : 'in-stock'

  return (
    <Link to={`/products/${product.slug}`} className="card-link">
      <div className="card">
        <div className="card-image-wrap">
          <img
            src={
              product.image ||
              "https://picsum.photos/seed/" + product.slug + "/400/300"
            }
            alt={product.name}
            className="card-image"
          />
        </div>
        <div className="card-body">
          <h2 className="card-name">{product.name}</h2>
          <p className="card-description">{product.description}</p>
          <div className="card-footer">
            <span className="card-price">${product.price.toFixed(2)}</span>
            {product.rating > 0 ? (
              <span className="card-rating">
                ★ {Number(product.rating).toFixed(1)}
              </span>
            ) : (
              <span className="card-badge-new">New</span>
            )}
          </div>
          <span className={`card-stock ${stockClass}`}>
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </span>
        </div>
      </div>
    </Link>
  );
}
