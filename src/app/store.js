import { configureStore } from "@reduxjs/toolkit";
import auth from "../features/auth/authSlice";
import calendars from "../features/calendars/calendarsSlice";
import events from "../features/events/eventsSlice";
import sharedEvents from "../features/sharedEvents/sharedEventsSlice";

export const store = configureStore({ reducer: { auth, calendars, events, sharedEvents } });
