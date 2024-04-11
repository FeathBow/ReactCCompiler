import React, { type ReactElement } from 'react';
import { Box, Button, Stack, IconButton, useColorMode } from '@chakra-ui/react';
import { SunIcon, MoonIcon } from '@chakra-ui/icons';
import HeaderItem from '../HeaderItem';

interface HeaderLinksProperties {
    isOpen: boolean;
}

/**
 * `HeaderLinks` component.
 * @param {HeaderLinksProperties} props - The properties of the component.
 * @returns {ReactElement} The `HeaderLinks` component.
 */
function HeaderLinks({ isOpen }: Readonly<HeaderLinksProperties>): ReactElement {
    const { colorMode, toggleColorMode } = useColorMode();
    return (
        <Box display={{ base: isOpen ? 'block' : 'none', md: 'block' }} flexBasis={{ base: '100%', md: 'auto' }}>
            <Stack
                spacing={8}
                align='center'
                justify={['center', 'space-between', 'flex-end', 'flex-end']}
                direction={['column', 'row', 'row', 'row']}
                pt={[4, 4, 0, 0]}
            >
                <HeaderItem isLast={false}>
                    <IconButton
                        icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                        onClick={toggleColorMode}
                        aria-label='Toggle color mode'
                        variant='ghost'
                    />
                </HeaderItem>
                <HeaderItem to='/' isLast={false}>
                    Home
                </HeaderItem>
                <HeaderItem to='/assembly' isLast={false}>
                    Assembly
                </HeaderItem>
                <HeaderItem to='/quadruple' isLast={false}>
                    Quadruple
                </HeaderItem>
                <HeaderItem to='/signup' isLast>
                    <Button
                        size='sm'
                        rounded='md'
                        color={['primary.500', 'primary.500', 'white', 'white']}
                        bg={['white', 'white', 'primary.500', 'primary.500']}
                        _hover={{
                            bg: ['primary.100', 'primary.100', 'primary.600', 'primary.600'],
                        }}
                    >
                        Create Account
                    </Button>
                </HeaderItem>
            </Stack>
        </Box>
    );
}

export default HeaderLinks;
