import { createBrowserRouter } from "react-router-dom";
import App from "../App.jsx";
import Calendar from "../pages/CalendarPage.jsx";
import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";
import CalendarInvitePage from "../pages/CalendarInvitePage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";

const router = createBrowserRouter([
  { path: "/", element: <Calendar /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/profile", element: <ProfilePage /> },
  { path: "/calendar-invite/accept", element: <CalendarInvitePage /> },
  { path: "/calendar-invite/decline", element: <CalendarInvitePage /> },
  { path: "*", element: <NotFoundPage /> },
]);

export default router;