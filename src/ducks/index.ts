import { configureStore } from '@reduxjs/toolkit';
import counter from "./counter"

const store = configureStore({
  reducer: {
    counter,
  },
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

declare module "react-redux" {
	export interface DefaultRootState extends RootState {}
}

export default store;