import { configureStore } from '@reduxjs/toolkit';
import rootReducer from "./rootReducers";
import { injectStore } from "../api/axiosInstance";

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ 
        serializableCheck: false
    }),
});

// Call the injection
injectStore(store);

// RootState: Represents the entire state tree
export type RootState = ReturnType<typeof store.getState>;

// AppDispatch: Type for the dispatch function
export type AppDispatch = typeof store.dispatch;

// AppStore: Type for the entire store instance
export type AppStore = typeof store;