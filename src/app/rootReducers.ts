// src/app/rootReducers.ts
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';

const rootReducer = combineReducers({
    auth: authReducer,
    // add other reducers here
});

export default rootReducer;