import { Flex, chakra, Icon, useColorMode, Box } from '@chakra-ui/react';
import { IconType } from 'react-icons';
import React from 'react';

interface SocialLink {
    href: string;
    label: string;
    icon: IconType;
}

interface FooterProps {
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

                <chakra.p py={{ base: '2', sm: '0' }} color={colorMode === 'light' ? 'gray.800' : 'white'}>
                    {rightsText}
                </chakra.p>

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
        </Box>
    );
}

export default BaseFooter;
