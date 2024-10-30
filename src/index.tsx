/* eslint-disable import/no-import-module-exports */
import * as React from 'react';
import ReactDOM from 'react-dom';
import { ChakraProvider } from '@chakra-ui/react';
import Header from 'Components/Header';
// import { BrowserRouter } from 'react-router-dom';
import { HashRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
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
            <Router>
                <Header />
                <AppRoutes />
            </Router>
        </ChakraProvider>
    );
}

ReactDOM.render(<IndexView />, document.querySelector('#root'));
