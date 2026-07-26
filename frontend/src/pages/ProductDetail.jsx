import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProductBySlug } from '../api/products.js'
import Header from '../components/Header.jsx'

function StarRow({ rating }) {
  const full = Math.round(rating)
  return (
    <span className="stars" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < full ? '★' : '☆'}</span>
      ))}
    </span>
  )
}

export default function ProductDetail() {
  const { slug } = useParams()
  const [{ product, loading, error }, setState] = useState({
    product: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    getProductBySlug(slug)
      .then((data) => {
        if (!cancelled)
          setState({ product: data, loading: false, error: null })
      })
      .catch((err) => {
        if (!cancelled)
          setState({ product: null, loading: false, error: err.message })
      })
    return () => { cancelled = true }
  }, [slug])

  return (
    <div className="page">
      <Header />
      <main>
        {loading && (
          <p className="status">
            <span className="status-spinner" aria-hidden="true" />
            Loading…
          </p>
        )}
        {error && <p className="status error">{error}</p>}
        {!loading && !error && product && (
          <div className="detail">
            <div className="detail-image-wrap">
              <img
                src={product.image || 'https://picsum.photos/seed/' + product.slug + '/600/400'}
                alt={product.name}
                className="detail-image"
              />
            </div>
            <div className="detail-info">
              <h1 className="detail-name">{product.name}</h1>
              <p className="detail-price">${product.price.toFixed(2)}</p>
              <div className="detail-rating">
                {product.rating > 0 ? (
                  <>
                    <StarRow rating={product.rating} />
                    <span className="detail-rating-value">
                      {Number(product.rating).toFixed(1)} / 5
                    </span>
                  </>
                ) : (
                  <span className="detail-no-rating">No reviews yet</span>
                )}
              </div>
              <hr className="detail-divider" />
              <p className="detail-description">{product.description}</p>
              <p className={`detail-stock ${product.stock === 0 ? 'out-of-stock' : ''}`}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </p>

              {product.reviews && product.reviews.length > 0 && (
                <section className="reviews">
                  <h2>Customer Reviews</h2>
                  <div className="review-list">
                    {product.reviews.map((review, i) => (
                      <div key={i} className="review">
                        <div className="review-header">
                          <span className="review-author">{review.createdBy}</span>
                          <StarRow rating={review.rating} />
                        </div>
                        {review.comment && (
                          <p className="review-comment">{review.comment}</p>
                        )}
                        <p className="review-date">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
