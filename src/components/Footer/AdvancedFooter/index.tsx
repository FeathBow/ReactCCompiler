import React, { useEffect, useState } from 'react';
import {
    Box,
    Stack,
    Flex,
    HStack,
    VStack,
    Divider,
    Text,
    Icon,
    useColorMode,
    Button,
    Grid,
    GridItem,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import CCompilerLogo from '../../../../public/image/ReactCCompiler.svg';

/**
 * LinkProperties interface.
 * @interface
 * @property {string} href - The href of the link.
 * @property {string} ariaLabel - The aria label of the link.
 */
export interface LinkProperties {
    href: string;
    ariaLabel: string;
}

/**
 * SocialLinkProperties interface.
 * @interface
 * @property {React.ElementType} icon - The icon of the social link.
 */
export interface SocialLinkProperties extends LinkProperties {
    icon: React.ElementType;
}

/**
 * MenuItemProperties interface.
 * @interface
 * @property {string} title - The title of the menu item.
 * @property {LinkProperties[]} links - The links of the menu item.
 */
export interface MenuItemProperties {
    title: string;
    links: LinkProperties[];
}

/**
 * AdvancedFooterProperties interface.
 * @interface
 * @property {string} logoSrc - The logo source.
 * @property {string} logoAlt - The logo alt.
 * @property {MenuItemProperties[]} menuItems - The menu items.
 * @property {SocialLinkProperties[]} socialLinks - The social links.
 */
export interface AdvancedFooterProperties {
    logoSrc: string;
    logoAlt: string;
    menuItems: MenuItemProperties[];
    socialLinks: SocialLinkProperties[];
}

/**
 * MenuLink component.
 * @param {LinkProperties} properties - The properties of the MenuLink component.
 * @returns {JSX.Element} The MenuLink component.
 */
function MenuLink({ href, ariaLabel }: Readonly<LinkProperties>): JSX.Element {
    const { colorMode } = useColorMode();
    return (
        <Button
            as={RouterLink}
            to={href}
            aria-label={ariaLabel}
            textTransform='uppercase'
            justifyContent='center'
            alignItems='center'
            variant='ghost'
            width='full'
            color={colorMode === 'light' ? 'gray.800' : 'white'}
        >
            {ariaLabel}
        </Button>
    );
}

/**
 * SocialButton component.
 * @param {SocialLinkProperties} properties - The properties of the SocialButton component.
 * @returns {JSX.Element} The SocialButton component.
 */
function SocialButton({ href, icon, ariaLabel }: Readonly<SocialLinkProperties>): JSX.Element {
    return (
        <Button as={RouterLink} to={href} variant='ghost' aria-label={ariaLabel} iconSpacing={0}>
            <Icon as={icon} boxSize='20px' />
        </Button>
    );
}
/**
 * AdvancedFooter component.
 * @param {AdvancedFooterProperties} props - The properties of the AdvancedFooter component.
 * @returns {JSX.Element} The AdvancedFooter component.
 */
function AdvancedFooter({ logoSrc, logoAlt, menuItems, socialLinks }: Readonly<AdvancedFooterProperties>): JSX.Element {
    const { colorMode } = useColorMode();

    const [siteRunTime, setSiteRunTime] = useState<string>('');

    useEffect(() => {
        const siteLaunchDate = new Date('2024-10-30T20:49:26');

        const updateSiteRunTime = (): void => {
            const now = new Date();
            const diff = now.getTime() - siteLaunchDate.getTime();

            if (diff < 0) {
                setSiteRunTime('Site launch date is in the future.');
                return;
            }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);

            setSiteRunTime(`${days} days ${hours} hours ${minutes} minutes`);
        };

        updateSiteRunTime();
        const intervalId = setInterval(updateSiteRunTime, 60_000);

        return () => {
            clearInterval(intervalId);
        };
    }, []);

    const currentYear = new Date().getFullYear();

    return (
        <Box bg={colorMode === 'light' ? 'white' : 'gray.600'}>
            <Stack direction={{ base: 'column', lg: 'row' }} w='full' justify='space-between' p={10}>
                <Flex justify='center' align='center'>
                    <Box width={{ base: '50%', lg: '100%' }}>
                        <CCompilerLogo width='100%' height='100%' fill={colorMode === 'light' ? 'gray.600' : 'white'} />
                    </Box>
                </Flex>

                <Grid templateColumns={{ md: 'repeat(3, 1fr)' }} width='full' gap={6}>
                    {menuItems.map((menuItem, index) => (
                        <GridItem colSpan={1} key={menuItem.title}>
                            <VStack align='start'>
                                {menuItem.links.map((link, linkIndex) => (
                                    <MenuLink key={link.ariaLabel} href={link.href} ariaLabel={link.ariaLabel} />
                                ))}
                            </VStack>
                        </GridItem>
                    ))}
                </Grid>
            </Stack>
            <Divider w='95%' mx='auto' color={colorMode === 'light' ? 'gray.600' : '#F9FAFB'} h='3.5px' />
            <VStack py={3}>
                <HStack justify='center'>
                    {socialLinks.map((socialLink, index) => (
                        <SocialButton
                            key={socialLink.ariaLabel}
                            href={socialLink.href}
                            icon={socialLink.icon}
                            ariaLabel={socialLink.ariaLabel}
                        />
                    ))}
                </HStack>
                <Flex direction='column' align='center' py={2}>
                    <Text textAlign='center' fontSize='smaller' color={colorMode === 'light' ? 'gray.800' : 'white'}>
                        Site running for: {siteRunTime}
                    </Text>
                    <Text textAlign='center' fontSize='smaller' color={colorMode === 'light' ? 'gray.800' : 'white'}>
                        &copy; {currentYear} CCompiler. All rights reserved.
                    </Text>
                </Flex>
            </VStack>
        </Box>
    );
}

export default AdvancedFooter;
