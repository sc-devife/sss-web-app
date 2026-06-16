// src/app/rootReducers.ts
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import escapePointsReducer from '../features/library/Redux/escapePointsSlice';

const rootReducer = combineReducers({
    auth: authReducer,
    escapePoints: escapePointsReducer
    // add other reducers here
});

export default rootReducer;