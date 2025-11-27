import { createBrowserRouter } from "react-router-dom";
import App from "../App.jsx";
import Calendar from "../pages/CalendarPage.jsx";
import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";

const router = createBrowserRouter([
  { path: "/", element: <Calendar /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/profile", element: <ProfilePage /> },
]);

export default router;