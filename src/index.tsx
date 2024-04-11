/* eslint-disable import/no-import-module-exports */
import * as React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { ChakraProvider, Grid, GridItem } from '@chakra-ui/react';
import Header from 'Components/Header';
import SideMenu from 'Components/SideMenu';
import Compiler from './compiler';

import { MenuList } from './components/SideMenu/commons';
import { FaHome, FaCode } from 'react-icons/fa';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

/* eslint-enable import/no-import-module-exports */

/* eslint-disable unicorn/prefer-module */
if (module?.hot !== undefined) {
    module.hot.accept();
}
/* eslint-enable unicorn/prefer-module */

// axios test using public api
axios
    .get('https://jsonplaceholder.typicode.com/posts')
    .then((response) => {
        console.log(response.data);
    })
    .catch((error) => {
        console.log(error);
    });

const testMenuList: MenuList = [
    {
        title: 'Home',
        path: '/',
        icon: <FaHome size='16px' />,
    },
    {
        title: 'Compiler',
        icon: <FaCode size='16px' />,
        subMenu: [{ title: 'Assembly', path: '/assembly' }, { title:'Quadruple', path: '/quadruple' }],
    },
];

const textColor = 'gray.700';

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
                <Grid templateColumns='1fr 13fr' gap={10} height='100vh'>
                    <GridItem>
                        <SideMenu menuList={testMenuList} />
                    </GridItem>
                    <GridItem>
                        <Grid templateColumns='12fr 1fr' gap={10} height='full'>
                            <GridItem height='100%'>
                                <Routes>
                                    <Route path='/' element={<div>Home Page</div>} />
                                    <Route path='/assembly' element={<Compiler />} />
                                    <Route path='/quadruple' element={<Compiler />} />
                                </Routes>
                            </GridItem>
                            <GridItem />
                        </Grid>
                    </GridItem>
                </Grid>
            </BrowserRouter>
        </ChakraProvider>
    );
}

ReactDOM.render(<IndexView />, document.querySelector('#root'));
