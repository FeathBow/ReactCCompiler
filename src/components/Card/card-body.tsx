import { Box } from '@chakra-ui/react';
import React, { type ReactNode } from 'react';

/**
 * CardBody properties.
 * @interface
 * @property {string} [variant] - The variant of the card body.
 * @property {ReactNode} children - The children of the card body.
 */
export interface CardBodyProperties {
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
 * CardBody component
 * @param {CardBodyProps} properties - The properties of the component.
 * @returns {JSX.Element} The CardBody component.
 */
function CardBody(properties: Readonly<CardBodyProperties>): JSX.Element {
    const { variant, children, ...rest } = properties;
    const styles = { ...styleConfig.baseStyle };

    return (
        <Box __css={styles} {...rest}>
            {children}
        </Box>
    );
}

export default CardBody;
