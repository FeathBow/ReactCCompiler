import React, { type ReactElement, type PropsWithChildren } from 'react';
import { Flex, ThemeProvider, Text, extendTheme } from '@chakra-ui/react';
import MenuToggle from './HeaderToggle';
import MenuLinks from './HeaderLinks';
import Logo from './Logo';

const colors = {
    primary: {
        100: '#E5FCF1',
        200: '#27EF96',
        300: '#10DE82',
        400: '#0EBE6F',
        500: '#0CA25F',
        600: '#0A864F',
        700: '#086F42',
        800: '#075C37',
        900: '#064C2E',
    },
};
const customTheme = extendTheme({
    colors,
});

interface NavBarContainerProperties {
    children: React.ReactNode;
    [key: string]: unknown;
}

/**
 * NavBarContainer 组件，用于包装导航栏的内容。
 * The NavBarContainer component is used to wrap the content of the navigation bar.
 * @param {PropsWithChildren<NavBarContainerProps>} properties - The properties of the component.
 * @returns {ReactElement} 返回一个 JSX 元素。Return a JSX element.
 */
function NavBarContainer({ children, ...properties }: PropsWithChildren<NavBarContainerProperties>): ReactElement {
    return (
        <Flex
            as='nav'
            align='center'
            justify='space-between'
            wrap='wrap'
            w='100%'
            mb={8}
            p={8}
            bg={['primary.500', 'primary.500', 'transparent', 'transparent']}
            color={['white', 'white', 'primary.700', 'primary.700']}
            {...properties}
        >
            {children}
        </Flex>
    );
}

type HeaderProperties = Record<string, unknown>;

/**
 * Header 组件，用于显示页面的标题。
 * The Header component, used to display the title of the page.
 * @param {HeaderProps} properties - The properties of the component.
 * @returns {ReactElement} 返回一个 JSX 元素。Return a JSX element.
 */
function Header(properties: Readonly<HeaderProperties>): ReactElement {
    const [isOpen, setIsOpen] = React.useState(false);

    const toggle = (): void => {
        setIsOpen(!isOpen);
    };

    return (
        <ThemeProvider theme={customTheme}>
            <NavBarContainer {...properties}>
                <Logo w='100px' color={['primary.500', 'primary.500', 'primary.500', 'primary.500']}>
                    <Text>CCompiler</Text>
                </Logo>
                <MenuToggle toggle={toggle} isOpen={isOpen} />
                <MenuLinks isOpen={isOpen} />
            </NavBarContainer>
        </ThemeProvider>
    );
}

export default Header;
