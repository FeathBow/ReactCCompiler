import React from 'react';
import { Box, Text, type BoxProps } from '@chakra-ui/react';

/**
 * Logo component
 * @param {BoxProps & {children?: React.ReactNode}} properties - The properties of the component.
 * @returns {JSX.Element} The Logo component.
 */
function Logo(properties: BoxProps & { children?: React.ReactNode }): JSX.Element {
    const { children, ...restProperties } = properties;
    return (
        <Box bg={restProperties.bg} color={restProperties.color}>
            <Text fontSize='lg' fontWeight='bold'>
                {children}
            </Text>
        </Box>
    );
}

export default Logo;
