import React, { type ReactNode } from 'react';
import { Flex } from '@chakra-ui/react';

interface SeparatorProperties {
    variant?: string;
    children?: ReactNode;
    [key: string]: unknown;
}

/**
 * Separator component
 * @param {SeparatorProps} properties - The properties of the component.
 * @returns {JSX.Element} The Separator component.
 */
function Separator(properties: Readonly<SeparatorProperties>): JSX.Element {
    const { variant, children, ...rest } = properties;
    return (
        <Flex
            h='1px'
            w='100%'
            bg='linear-gradient(90deg, rgba(224, 225, 226, 0) 0%, #E0E1E2 49.52%, rgba(224, 225, 226, 0) 100%)'
            {...rest}
        >
            {children}
        </Flex>
    );
}

export default Separator;
