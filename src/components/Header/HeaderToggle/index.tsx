import React, { type ReactElement } from 'react';
import { Box } from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { FiMenu as MenuIcon } from 'react-icons/fi';

/**
 * HeaderToggle properties.
 * @interface
 * @property {Function} toggle - The toggle function.
 * @property {boolean} isOpen - Whether the header is open.
 */
export interface HeaderToggleProperties {
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
