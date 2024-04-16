/* eslint-disable import/no-import-module-exports */
import * as React from 'react';
import ReactDOM from 'react-dom';
import { ChakraProvider } from '@chakra-ui/react';
import Header from 'Components/Header';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomeLayout from 'Layouts/HomeLayout';
import MainLayout from 'Layouts/MainLayout';
import Compiler from './compiler';
import HelpsPage from './pages/HelpsPage';
import HomePage from './pages/HomePage';
import TestsPage from './pages/TestsPage';
/* eslint-enable import/no-import-module-exports */

/* eslint-disable unicorn/prefer-module */
if (module?.hot !== undefined) {
    module.hot.accept();
}
/* eslint-enable unicorn/prefer-module */

/**
 * IndexView component.
 * 视窗组件。
 * @returns {JSX.Element} The rendered IndexView component.
 */
function IndexView(): JSX.Element {
    return (
        <ChakraProvider>
            <BrowserRouter>
                <Header />
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
                            <MainLayout>
                                <TestsPage />
                            </MainLayout>
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
            </BrowserRouter>
        </ChakraProvider>
    );
}

ReactDOM.render(<IndexView />, document.querySelector('#root'));
