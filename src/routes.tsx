import * as React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomeLayout from 'Layouts/HomeLayout';
import MainLayout from 'Layouts/MainLayout';
import Compiler from 'Components/Compiler';
import HelpsPage from './pages/HelpsPage';
import HomePage from './pages/HomePage';
import TestsPage from './pages/TestsPage';
import TimelinePage from './pages/TimeLinePage';

/**
 * AppRoutes component.
 * @returns {JSX.Element} The AppRoutes component.
 */
function AppRoutes(): JSX.Element {
    return (
        <Routes>
            <Route
                path='/'
                element={
                    <HomeLayout>
                        <HomePage />
                    </HomeLayout>
                }
            />
            <Route
                path='/assembly'
                element={
                    <MainLayout>
                        <Compiler />
                    </MainLayout>
                }
            />
            <Route
                path='/quadruple'
                element={
                    <MainLayout>
                        <Compiler />
                    </MainLayout>
                }
            />
            <Route
                path='/helps'
                element={
                    <MainLayout>
                        <HelpsPage />
                    </MainLayout>
                }
            />
            <Route
                path='/tests'
                element={
                    <HomeLayout>
                        <TestsPage />
                    </HomeLayout>
                }
            />
            <Route
                path='/timeline'
                element={
                    <HomeLayout>
                        <TimelinePage />
                    </HomeLayout>
                }
            />
            <Route
                path='*'
                element={
                    <HomeLayout>
                        <div>404 Not Found</div>
                    </HomeLayout>
                }
            />
        </Routes>
    );
}

export default AppRoutes;
