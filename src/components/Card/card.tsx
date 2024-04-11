import { Box, type ColorMode } from '@chakra-ui/react';
import React, { type ReactNode } from 'react';

interface PanelProperties {
    colorMode: 'dark' | 'light';
}

interface VariantStyles {
    bg: string;
    width: string;
    boxShadow: string;
    borderRadius: string;
}

interface CardProperties {
    variant?: 'panel';
    children: ReactNode;
    colorMode?: ColorMode;
    [key: string]: unknown;
}

const styleConfig = {
    baseStyle: {
        p: '22px',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        position: 'relative',
        minWidth: '0px',
        wordWrap: 'break-word',
        backgroundClip: 'border-box',
    },
    variants: {
        panel: (properties: PanelProperties): VariantStyles => ({
            bg: properties.colorMode === 'dark' ? 'gray.700' : 'gray.100',
            width: '100%',
            boxShadow: '0px 3.5px 5.5px rgba(0, 0, 0, 0.05)',
            borderRadius: '15px',
        }),
    },
    defaultProps: {
        variant: 'panel',
    },
};
const defaultVariantStyles: VariantStyles = {
    bg: 'transparent',
    width: '100%',
    boxShadow: 'none',
    borderRadius: '0',
};

/**
 * Card component
 * @param {CardProperties} properties - The properties of the component.
 * @returns {JSX.Element} The Card component.
 */
function Card({ variant = 'panel', colorMode = 'light', children, ...rest }: Readonly<CardProperties>): JSX.Element {
    const variantFunction = styleConfig.variants[variant as keyof typeof styleConfig.variants];
    const variantStyles: VariantStyles =
        variantFunction === undefined ? defaultVariantStyles : variantFunction({ colorMode });

    const styles = { ...styleConfig.baseStyle, ...variantStyles };

    return (
        <Box __css={styles} {...rest}>
            {children}
        </Box>
    );
}

export default Card;
