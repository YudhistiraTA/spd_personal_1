import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/useAuth.js";

/**
 * @param {{ mode: 'login' | 'register', onModeChange: (mode: 'login' | 'register') => void, onClose: () => void }} props
 */
export default function AuthDialog({ mode, onModeChange, onClose }) {
  const dialogRef = useRef(null);
  const { login, register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === "register";

  // Open the native <dialog> as a modal on mount, close it on unmount. The
  // parent remounts this component (via a `key={mode}` prop) whenever the
  // mode switches between login/register, so form state always starts fresh.
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors([]);
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(form.name, form.email, form.password);
      } else {
        await login(form.email, form.password);
      }
      onClose();
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.errors || []);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="auth-dialog"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form-header">
          <h2>{isRegister ? "Create an account" : "Log in"}</h2>
          <button
            type="button"
            className="auth-dialog-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {isRegister && (
          <label className="auth-field">
            <span>Name</span>
            <input
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
            />
          </label>
        )}

        <label className="auth-field">
          <span>Email</span>
          <input
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
          />
        </label>

        <label className="auth-field">
          <span>Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={isRegister ? 8 : undefined}
            value={form.password}
            onChange={handleChange}
            autoComplete={isRegister ? "new-password" : "current-password"}
          />
        </label>

        {error && (
          <div className="auth-error">
            <p>{error}</p>
            {fieldErrors.length > 0 && (
              <ul>
                {fieldErrors.map((fieldError, i) => (
                  <li key={i}>{fieldError}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary auth-submit"
          disabled={submitting}
        >
          {submitting ? "Please wait…" : isRegister ? "Sign up" : "Log in"}
        </button>

        <p className="auth-switch">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => onModeChange("login")}>
                Log in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button type="button" onClick={() => onModeChange("register")}>
                Sign up
              </button>
            </>
          )}
        </p>
      </form>
    </dialog>
  );
}
