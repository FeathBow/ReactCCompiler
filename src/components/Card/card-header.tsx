import { Box } from '@chakra-ui/react';
import React, { type ReactNode } from 'react';

/**
 * CardHeader properties.
 * @interface
 * @property {string} [variant] - The variant of the card header.
 * @property {ReactNode} children - The children of the card header.
 */
export interface CardHeaderProperties {
    variant?: string;
    children: ReactNode;
    [key: string]: unknown;
}

const styleConfig = {
    baseStyle: {
        display: 'flex',
        width: '100%',
    },
};

/**
 * CardHeader component
 * @param {CardHeaderProperties} properties - The properties of the component.
 * @returns {JSX.Element} The CardHeader component.
 */
function CardHeader(properties: Readonly<CardHeaderProperties>): JSX.Element {
    const { variant, children, ...rest } = properties;
    const styles = { ...styleConfig.baseStyle };

    return (
        <Box __css={styles} {...rest}>
            {children}
        </Box>
    );
}

export default CardHeader;
