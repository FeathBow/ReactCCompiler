import * as React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Center, Spinner } from '@chakra-ui/react';

const Compiler = React.lazy(() => import('Components/Compiler'));
const HomeLayout = React.lazy(() => import('Layouts/HomeLayout'));
const HelpsPage = React.lazy(() => import('./pages/HelpsPage'));
const HomePage = React.lazy(() => import('./pages/HomePage'));
const MainLayout = React.lazy(() => import('Layouts/MainLayout'));
const TestsPage = React.lazy(() => import('./pages/TestsPage'));
const TimelinePage = React.lazy(() => import('./pages/TimeLinePage'));

function RouteLoader(): JSX.Element {
    return (
        <Center minHeight='40vh'>
            <Spinner color='teal.500' />
        </Center>
    );
}

/**
 * AppRoutes component.
 * @returns {JSX.Element} The AppRoutes component.
 */
function AppRoutes(): JSX.Element {
    return (
        <React.Suspense fallback={<RouteLoader />}>
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
        </React.Suspense>
    );
}

export default AppRoutes;
