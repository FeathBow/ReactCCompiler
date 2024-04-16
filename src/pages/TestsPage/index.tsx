import React from 'react';
import FeaturesGrid from 'Components/Features/FeatureGrid';
import { Grid, GridItem } from '@chakra-ui/react';
import Separator from 'Components/Separator';
import { arithmeticFeatures, controlFeatures, functionFeatures, pointerArrayFeatures } from './common';

/**
 * TestsPage component.
 * @returns {JSX.Element} The TestsPage component.
 */
function TestsPage(): JSX.Element {
    return (
        <Grid templateColumns='repeat(1, 1fr)' gap={6} height='full'>
            <GridItem>
                <FeaturesGrid
                    features={arithmeticFeatures}
                    introductionText='Dive into the realm of arithmetic where every addition, subtraction, multiplication, and division is meticulously validated.'
                    introductionHeading='Arithmetic Operations Mastery'
                    introductionPosition='left'
                />
            </GridItem>
            <Separator />
            <GridItem>
                <FeaturesGrid
                    features={controlFeatures}
                    introductionText='Our rigorous testing confirms the unfailing execution of conditional statements and loop constructs, forming the backbone of logical flow in your programs.'
                    introductionHeading='Control Structure Perfection'
                    introductionPosition='right'
                />
            </GridItem>
            <Separator />
            <GridItem>
                <FeaturesGrid
                    features={functionFeatures}
                    introductionText='Embark on a journey of function exploration. Witness the elegance of recursion, the power of aggregate computation, and the harmony of function integration, ensuring each function behaves as intended.'
                    introductionHeading='Functional Operation Excellence'
                    introductionPosition='left'
                />
            </GridItem>
            <Separator />
            <GridItem>
                <FeaturesGrid
                    features={pointerArrayFeatures}
                    introductionText='Unravel the complexities of pointers and arrays. From basic manipulations to advanced multidimensional array operations, every test ensures your mastery over crucial memory management and data structuring techniques.'
                    introductionHeading='Pointer and Array Mastery'
                    introductionPosition='right'
                />
            </GridItem>
        </Grid>
    );
}

export default TestsPage;
