import { Navigate } from "react-router";

/**
 * The old starter dashboard route. DEALWAR's authenticated home is the
 * hunter profile — send anyone landing on /dashboard there.
 */
export default function Dashboard() {
  return <Navigate to="/profile" replace />;
}
