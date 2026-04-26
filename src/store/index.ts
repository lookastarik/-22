import { configureStore } from '@reduxjs/toolkit';
import tacticalReducer from './tacticalSlice';

export const store = configureStore({
  reducer: {
    tactical: tacticalReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
