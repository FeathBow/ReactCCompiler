import * as React from 'react';
import { MenuList } from './commons';
import { FaHome, FaCode } from 'react-icons/fa';

const sideMenuList: MenuList = [
    {
        title: 'Home',
        path: '/',
        icon: <FaHome size='16px' />,
    },
    {
        title: 'Compiler',
        icon: <FaCode size='16px' />,
        subMenu: [
            { title: 'Assembly', path: '/assembly' },
            { title: 'Quadruple', path: '/quadruple' },
        ],
    },
];
export default sideMenuList;
