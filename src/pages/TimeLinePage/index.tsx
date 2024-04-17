import React from 'react';
import { Grid, GridItem } from '@chakra-ui/react';
import TimelinePanel from 'Components/Panel/TimeLinePanel';
import Separator from 'Src/components/Separator';
import { FaCalendarAlt, FaCode, FaTools, FaCogs, FaVial, FaClipboardCheck } from 'react-icons/fa';

const timelineData = [
    {
        logo: FaCalendarAlt,
        title: 'Project Initialization',
        date: '22 Mar 2024',
        color: 'blue.500',
        description: 'Setup of the development environment and configurations.',
        children: [],
    },
    {
        logo: FaCode,
        title: 'Core Development Phases',
        date: '28 Mar - 13 Apr 2024',
        color: 'green.500',
        description: 'Implementation of basic and complex system functionalities.',
        children: [
            {
                title: 'Basic Data Types and Control Structures',
                date: '28 Mar - 30 Mar 2024',
                description: "Implemented basic data types and control flow statements like 'if', 'for', and 'while'.",
                logo: FaTools,
                color: 'teal.300',
            },
            {
                title: 'Advanced Features',
                date: '1 Apr - 4 Apr 2024',
                description: 'Added advanced system features such as arrays, pointers, and register-based procedures.',
                logo: FaCogs,
                color: 'orange.400',
            },
            {
                title: 'Integration and Testing',
                date: '6 Apr - 13 Apr 2024',
                description: 'Integrated all components and conducted thorough testing.',
                logo: FaVial,
                color: 'purple.300',
            },
        ],
    },
    {
        logo: FaClipboardCheck,
        title: 'Feature Completion and Documentation',
        date: '17 Apr 2024',
        color: 'red.500',
        description: 'Finalized all features and completed all related documentation.',
        children: [
            {
                title: 'Test Page and Help Page',
                date: '12 Apr - 17 Apr 2024',
                description: 'Developed test and help pages for better user interaction and support.',
                logo: FaVial,
                color: 'yellow.400',
            },
        ],
    },
];

/**
 * TimeLinePage component.
 * @returns {JSX.Element} The TimeLinePage component.
 */
function TimeLinePage(): JSX.Element {
    return (
        <Grid templateColumns='1fr 13fr 1fr' gap={6} height='full'>
            <GridItem />
            <GridItem>
                <TimelinePanel timelineData={timelineData} />
                <Separator />
            </GridItem>
            <GridItem />
        </Grid>
    );
}

export default TimeLinePage;
