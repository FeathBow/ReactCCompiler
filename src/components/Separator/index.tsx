import React, { type ReactNode } from 'react';
import { Center, Box, Text } from '@chakra-ui/react';

/**
 * Separator properties.
 * @interface
 * @property {ReactNode} children - The children of the separator.
 */
export interface SeparatorProperties {
    children?: ReactNode;
}

/**
 * Separator component
 * @param {SeparatorProps} properties - The properties of the component.
 * @returns {JSX.Element} The Separator component.
 */
function Separator({children}: Readonly<SeparatorProperties>): JSX.Element {
    return (
        <Center position='relative' height='20px'>
            <Box
                position='absolute'
                height='1px'
                width='full'
                bgGradient='linear(to-r, transparent, gray.300, transparent)'
            />
            {children !== undefined && (
                <Text as='span' px='4' bg='white' position='relative' zIndex='1'>
                    {children}
                </Text>
            )}
        </Center>
    );
}

export default Separator;
