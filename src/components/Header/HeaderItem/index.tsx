import React, { type ReactNode } from 'react';
import { Text } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

interface HeaderItemProperties {
    children: ReactNode;
    isLast: boolean;
    to?: string;
    [key: string]: unknown;
}

/**
 * HeaderItem component.
 * @param {HeaderItemProps} props - The properties of the component.
 * @returns {JSX.Element} The `HeaderItem` component.
 */
function HeaderItem({ children, isLast, to, ...rest }: Readonly<HeaderItemProperties>): JSX.Element {
    if (to !== undefined) {
        return (
            <Link to={to} style={{ textDecoration: 'none' }}>
                <Text
                    display='block'
                    rounded='lg'
                    p={2}
                    transition='all 0.3s ease'
                    _hover={{
                        transform: 'scale(1.03)',
                        fontWeight: 'bold',
                        boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.2)',
                        textDecoration: 'none',
                    }}
                    {...rest}
                >
                    {children}
                </Text>
            </Link>
        );
    }
    return (
        <Text
            display='block'
            rounded='lg'
            p={2}
            transition='all 0.3s ease'
            _hover={{
                transform: 'scale(1.03)',
                fontWeight: 'bold',
                boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.2)',
                textDecoration: 'none',
            }}
            {...rest}
        >
            {children}
        </Text>
    );
}

export default HeaderItem;
