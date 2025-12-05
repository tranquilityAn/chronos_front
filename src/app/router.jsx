import { createBrowserRouter } from "react-router-dom";
import App from "../App.jsx";
import Calendar from "../pages/CalendarPage.jsx";
import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";
import CalendarInvitePage from "../pages/CalendarInvitePage.jsx";
import EventInvitePage from "../pages/EventInvitePage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage.jsx";

const router = createBrowserRouter([
  { path: "/", element: <Calendar /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/profile", element: <ProfilePage /> },
  { path: "/verify-email", element: <VerifyEmailPage /> },
  { path: "/calendar-invite/accept", element: <CalendarInvitePage /> },
  { path: "/calendar-invite/decline", element: <CalendarInvitePage /> },
  { path: "/event-invite/accept", element: <EventInvitePage /> },
  { path: "/event-invite/decline", element: <EventInvitePage /> },
  { path: "*", element: <NotFoundPage /> },
]);

export default router;