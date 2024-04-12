import ScreenShotPanel from 'Components/Panel/ScreenShotPanel';
import React from 'react';
import { Grid, GridItem } from '@chakra-ui/react';
import Separator from 'Components/Separator';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import AssemblyPng from '../../../public/image/Assembly.png';
import QuadruplePng from '../../../public/image/Quadruple.png';
/**
 * HomePage component.
 * @returns {JSX.Element} The HomePage component.
 */
function HomePage(): JSX.Element {
    return (
        <Grid templateColumns='repeat(1, 1fr)' gap={6} height='full'>
            <GridItem>
                <ScreenShotPanel
                    isImageOnLeft
                    title='Illuminate Your Code'
                    subtitle='Instant Assembly Insight'
                    description="Dive into a world where your code comes to life with vibrant syntax highlighting. Witness the seamless transformation of your C-like code into precise assembly instructions, offering you a window into the machine's mind. Empower your development journey with tools that anticipate your needs, streamline your workflow, and ignite your productivity."
                    imageUrl={AssemblyPng}
                    scaleImage='proportional'
                    imageAlt='Code Highlighting and Assembly Generation Illustration'
                    buttonText='Explore Assembly'
                    buttonLink='/Assembly'
                    buttonIcon={ArrowForwardIcon}
                />
            </GridItem>

            <Separator />
            <GridItem>
                <ScreenShotPanel
                    isImageOnLeft={false}
                    title='Embrace the Dark Side'
                    subtitle='Quadruple Table Enlightenment'
                    description="Switch to dark mode and experience a visual comfort that enhances focus while reducing eye strain during those long coding sessions. Unveil the essence of your code with the generation of quadruple tables, offering a clear and optimized view of your logic's inner workings. It's not just about understanding code; it's about experiencing it in a whole new light."
                    imageUrl={QuadruplePng}
                    scaleImage='proportional'
                    imageAlt='Dark Mode and Quadruple Table Generation Illustration'
                    buttonText='Explore Quadruple'
                    buttonLink='/Quadruple'
                    buttonIcon={ArrowForwardIcon}
                />
            </GridItem>
        </Grid>
    );
}

export default HomePage;
