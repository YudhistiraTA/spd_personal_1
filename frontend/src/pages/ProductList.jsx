import { useEffect, useState, useTransition } from 'react'
import { getProducts } from '../api/products.js'
import ProductCard from '../components/ProductCard.jsx'

export default function ProductList() {
  const [{ products, loading, error, pagination }, setState] = useState({
    products: [],
    loading: true,
    error: null,
    pagination: null,
  })
  const [page, setPage] = useState(1)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    getProducts(page)
      .then(({ data, pagination }) => {
        if (!cancelled)
          setState({ products: data, pagination, loading: false, error: null })
      })
      .catch((err) => {
        if (!cancelled)
          setState((prev) => ({ ...prev, loading: false, error: err.message }))
      })
    return () => { cancelled = true }
  }, [page])

  return (
    <div className="page">
      <header className="site-header">
        <div>
          <h1>Shop<span className="accent">.</span></h1>
          <p className="header-tagline">Discover our curated collection</p>
        </div>
      </header>
      <main>
        {(loading || isPending) && (
          <p className="status">
            <span className="status-spinner" aria-hidden="true" />
            Loading products…
          </p>
        )}
        {error && !loading && <p className="status error">{error}</p>}
        {!loading && !error && (
          <>
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
            {pagination && pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={page === 1 || isPending}
                  onClick={() => startTransition(() => setPage((p) => p - 1))}
                >
                  ← Previous
                </button>
                <span className="pagination-info">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  disabled={page === pagination.totalPages || isPending}
                  onClick={() => startTransition(() => setPage((p) => p + 1))}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
