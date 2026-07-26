import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import AuthDialog from './AuthDialog.jsx'

export default function Header() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const { user, loading, logout } = useAuth()
  const [dialogMode, setDialogMode] = useState(null) // null | 'login' | 'register'

  return (
    <header className="site-header">
      <div className="header-left">
        {isHome ? (
          <div>
            <h1>Shop<span className="accent">.</span></h1>
            <p className="header-tagline">Discover our curated collection</p>
          </div>
        ) : (
          <Link to="/" className="back-link">← Back to products</Link>
        )}
      </div>

      <div className="header-right">
        {!loading && (
          user ? (
            <>
              <span className="header-username">Hi, {user.name}</span>
              <button type="button" className="btn-ghost" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setDialogMode('login')}
              >
                Log in
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setDialogMode('register')}
              >
                Sign up
              </button>
            </>
          )
        )}
      </div>

      {dialogMode && (
        <AuthDialog
          key={dialogMode}
          mode={dialogMode}
          onModeChange={setDialogMode}
          onClose={() => setDialogMode(null)}
        />
      )}
    </header>
  )
}
