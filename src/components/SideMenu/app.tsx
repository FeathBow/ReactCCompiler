import * as React from 'react';
import { MenuList } from './commons';
import { FaHome, FaCode, FaTools, FaToolbox, FaHandsHelping, FaQuestion } from 'react-icons/fa';

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
    {
        title: 'Tools',
        icon: <FaToolbox size='16px' />,
        subMenu: [
            { title: 'GNU', path: 'https://www.gnu.org/gnu/gnu.en.html' },
            { title: 'GCC', path: 'https://gcc.gnu.org/' },
        ],
    },
    {
        title: 'Compiler Explorer',
        path: 'https://gcc.godbolt.org/',
        icon: <FaTools size='16px' />,
    },
    {
        title: 'Helps',
        path: '/helps',
        icon: <FaQuestion size='16px' />,
    }
];
export default sideMenuList;
