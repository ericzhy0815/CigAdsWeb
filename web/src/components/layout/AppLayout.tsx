import { Link, Outlet, useLocation } from "react-router-dom";

export function AppLayout() {
  const { pathname } = useLocation();

  const headerAction =
    pathname === "/" || pathname === "/info"
      ? { to: "/datasets", label: "Start" }
      : pathname === "/login"
        ? { to: "/login", label: "Login" }
        : { to: "/", label: "Logout" };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <h1>
            <Link to="/" className="brand-link">
              CigAds Labeling Platform
            </Link>
          </h1>
          <p>Frontend placeholder structure</p>
        </div>

        <Link to={headerAction.to} className="primary-button">
          {headerAction.label}
        </Link>
      </header>
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}
