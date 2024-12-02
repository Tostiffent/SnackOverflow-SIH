import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./reducers/auth";

//the redux store to be used in the whole app
export const store = configureStore({
  //this uses individual reducer slices to make on combied reducer
  reducer: {
    auth: authReducer,
  },
  //enable logger middleware only while testing
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger),
});

export type RootState = ReturnType<typeof store.getState>;
