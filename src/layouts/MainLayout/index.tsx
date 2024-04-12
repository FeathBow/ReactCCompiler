import React from 'react';
import { Grid, GridItem } from '@chakra-ui/react';
import SideMenu from 'Components/SideMenu';
import sideMenuList from 'Components/SideMenu/app';
import BaseFooter from 'Components/Footer/BaseFooter';
import { FaFacebook, FaGithub, FaTwitter } from 'react-icons/fa';
import Separator from 'Components/Separator';

const socialLinks = [
    { href: '#', label: 'Facebook', icon: FaFacebook },
    { href: '#', label: 'Twitter', icon: FaTwitter },
    { href: '#', label: 'Github', icon: FaGithub },
];

/**
 * main layout
 * @param {React.ReactNode} children - children components
 * @returns {JSX.Element} The MainLayout component.
 */
function MainLayout({ children }: Readonly<{ children: React.ReactNode }>): JSX.Element {
    return (
        <>
            <Grid templateColumns='1fr 13fr' gap={10} height='100vh'>
                <GridItem>
                    <SideMenu menuList={sideMenuList} />
                </GridItem>
                <Grid templateColumns='12fr 1fr' gap={10} height='full'>
                    <GridItem height='100%'>{children}</GridItem>
                    <GridItem />
                </Grid>
            </Grid>
            <Separator />
            <BaseFooter brandText='CCompiler' brandLink='#' rightsText='All rights reserved' socialLinks={socialLinks} />
        </>
    );
}

export default MainLayout;
