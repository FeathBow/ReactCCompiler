import React, { type ReactNode } from 'react';
import { Link, Text } from '@chakra-ui/react';

interface HeaderItemProperties {
    children: ReactNode;
    isLast: boolean;
    to?: string;
    [key: string]: unknown;
}

HeaderItem.defaultProps = {
    to: '/',
};

/**
 * HeaderItem component.
 * @param {HeaderItemProps} props - The properties of the component.
 * @returns {JSX.Element} The `HeaderItem` component.
 */
function HeaderItem({ children, isLast, to, ...rest }: Readonly<HeaderItemProperties>): JSX.Element {
    return (
        <Link href={to}>
            <Text display='block' {...(rest as object)}>
                {children}
            </Text>
        </Link>
    );
}

export default HeaderItem;
