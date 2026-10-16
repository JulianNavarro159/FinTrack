import React from 'react';
import { AppRouter } from './router/AppRouter';
import { OfflineIndicator } from './components/OfflineIndicator';

export const FinTrack = () => {
    return (
        <>
            <AppRouter />
            <OfflineIndicator />
        </>
    );
};
