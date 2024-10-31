import { Flex, chakra, Icon, useColorMode, Box, Text } from '@chakra-ui/react';
import { IconType } from 'react-icons';
import React, { useEffect, useState } from 'react';

/**
 * SocialLink interface.
 * @interface
 * @property {string} href - The link.
 * @property {string} label - The label.
 * @property {IconType} icon - The icon.
 */
export interface SocialLink {
    href: string;
    label: string;
    icon: IconType;
}

/**
 * FooterProps interface.
 * @interface
 * @property {string} brandText - The brand text.
 * @property {string} brandLink - The brand link.
 * @property {string} rightsText - The rights text.
 * @property {SocialLink[]} socialLinks - The social links.
 */
export interface FooterProps {
    brandText: string;
    brandLink: string;
    rightsText: string;
    socialLinks: SocialLink[];
}

/**
 * Footer component
 * @param {FooterProps} props - props
 * @returns {JSX.Element} The Footer component.
 */
function BaseFooter({ brandText, brandLink, rightsText, socialLinks }: Readonly<FooterProps>): JSX.Element {
    const { colorMode } = useColorMode();

    const [siteRunTime, setSiteRunTime] = useState<string>('');

    useEffect(() => {
        const siteLaunchDate = new Date('2024-10-30T20:49:26');

        const updateSiteRunTime = () => {
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
        const intervalId = setInterval(updateSiteRunTime, 60000); // 每分钟更新一次

        return () => clearInterval(intervalId);
    }, []);

    const currentYear = new Date().getFullYear();

    return (
        <Box mt='auto'>
            <Flex
                w='full'
                as='footer'
                flexDir={{ base: 'column', sm: 'row' }}
                align='center'
                justify='space-between'
                px='6'
                py='4'
                bg={colorMode === 'light' ? 'white' : 'gray.800'}
                boxShadow='sm'
            >
                <chakra.a
                    href={brandLink}
                    fontSize='xl'
                    fontWeight='bold'
                    color={colorMode === 'light' ? 'gray.600' : 'white'}
                    _hover={{
                        color: colorMode === 'light' ? 'gray.700' : 'gray.300',
                    }}
                >
                    {brandText}
                </chakra.a>

                <Flex direction='column' align='center' py={{ base: '2', sm: '0' }}>
                    <Text color={colorMode === 'light' ? 'gray.800' : 'white'}>Site running for: {siteRunTime}</Text>
                    <Text color={colorMode === 'light' ? 'gray.800' : 'white'}>
                        &copy; {currentYear} {brandText}. All rights reserved.
                    </Text>
                </Flex>

                <Flex direction='column' align='center'>
                    <Flex mx='-2'>
                        {socialLinks.map((link) => (
                            <chakra.a
                                key={link.label}
                                href={link.href}
                                mx='2'
                                color={colorMode === 'light' ? 'gray.600' : 'gray.300'}
                                _hover={{
                                    color: colorMode === 'light' ? 'gray.500' : 'gray.400',
                                }}
                                aria-label={link.label}
                            >
                                <Icon as={link.icon} boxSize='5' fill='currentColor' />
                            </chakra.a>
                        ))}
                    </Flex>
                </Flex>
            </Flex>
        </Box>
    );
}

export default BaseFooter;
