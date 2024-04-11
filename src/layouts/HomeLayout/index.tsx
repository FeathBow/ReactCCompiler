import React from 'react';
import { Grid, GridItem } from '@chakra-ui/react';

/**
 * home layout
 * @param {React.ReactNode} children - children components
 * @returns {JSX.Element} The HomeLayout component.
 */
function HomeLayout({ children }: Readonly<{ children: React.ReactNode }>): JSX.Element {
    return (
        <Grid templateColumns='1fr' gap={10} height='100vh'>
                <GridItem height='100%'>{children}</GridItem>
        </Grid>
    );
}

export default HomeLayout;
