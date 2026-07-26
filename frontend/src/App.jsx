import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import LogRocket from "logrocket";
import ProductList from "./pages/ProductList.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";

export default function App() {
  const location = useLocation();

  // Record each route change as a LogRocket event so page visits show up
  // alongside the session replay.
  useEffect(() => {
    LogRocket.track("Page View", { path: location.pathname });
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<ProductList />} />
      <Route path="/products/:slug" element={<ProductDetail />} />
    </Routes>
  );
}
