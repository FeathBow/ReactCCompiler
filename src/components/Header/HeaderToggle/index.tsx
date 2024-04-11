import React, { type ReactElement } from 'react';
import { Box } from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { FiMenu as MenuIcon } from 'react-icons/fi';

interface HeaderToggleProperties {
    toggle: () => void;
    isOpen: boolean;
}

/**
 * `HeaderToggle` component.
 * @param {HeaderToggleProperties} props - The properties of the component.
 * @returns {ReactElement} The `HeaderToggle` component.
 */
function HeaderToggle({ toggle, isOpen }: Readonly<HeaderToggleProperties>): ReactElement {
    return (
        <Box display={{ base: 'block', md: 'none' }} onClick={toggle}>
            {isOpen ? <CloseIcon /> : <MenuIcon />}
        </Box>
    );
}

export default HeaderToggle;
