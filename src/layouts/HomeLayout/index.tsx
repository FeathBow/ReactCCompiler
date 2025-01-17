import React from 'react';
import { Grid, GridItem } from '@chakra-ui/react';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import AdvancedFooter from 'Components/Footer/AdvancedFooter';

const menuItems = [
    {
        title: 'Menu 1',
        links: [
            { href: '/', ariaLabel: 'CCompiler' },
            { href: '/assembly', ariaLabel: 'Assembly' },
            { href: '/quadruple', ariaLabel: 'Quadruple' },
        ],
    },
    {
        title: 'Menu 2',
        links: [
            { href: 'https://www.gnu.org/gnu/gnu.en.html', ariaLabel: 'GNU' },
            { href: 'https://gcc.gnu.org/', ariaLabel: 'GCC' },
            { href: 'https://gcc.godbolt.org/', ariaLabel: 'Compiler Explorer' },
        ],
    },
    {
        title: 'Menu 3',
        links: [
            { href: '/tests', ariaLabel: 'Show Case' },
            { href: '/timeline', ariaLabel: 'Time Line' },
            { href: '/helps', ariaLabel: 'Helps' },
        ],
    },
];

const socialLinks = [
    { href: '#', icon: FaFacebookF, ariaLabel: 'Facebook' },
    { href: '#', icon: FaTwitter, ariaLabel: 'Twitter' },
    { href: '#', icon: FaInstagram, ariaLabel: 'Instagram' },
    { href: '#', icon: FaLinkedinIn, ariaLabel: 'LinkedIn' },
];
/**
 * home layout
 * @param {React.ReactNode} children - children components
 * @returns {JSX.Element} The HomeLayout component.
 */
function HomeLayout({ children }: Readonly<{ children: React.ReactNode }>): JSX.Element {
    return (
        <>
            <Grid templateColumns='1fr' gap={10} height='full'>
                <GridItem>{children}</GridItem>
            </Grid>
            <AdvancedFooter logoSrc='' logoAlt='Logo' menuItems={menuItems} socialLinks={socialLinks} />
        </>
    );
}

export default HomeLayout;
