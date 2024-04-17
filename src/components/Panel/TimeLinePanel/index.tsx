import React from 'react';
import { Box, Flex, Icon, Text, useColorModeValue } from '@chakra-ui/react';
import Card from 'Components/Card/card';
import CardHeader from 'Components/Card/card-header';
import CardBody from 'Components/Card/card-body';
import { IconType } from 'react-icons';

/**
 * TimelineDataEntry interface.
 * @interface TimelineDataEntry
 * @property {IconType} logo - The logo of the timeline.
 * @property {string} title - The title of the timeline.
 * @property {string} date - The date of the timeline.
 * @property {string} color - The color of the timeline.
 * @property {TimelineDataEntry[]} children - The children of the timeline.
 */
export interface TimelineDataEntry {
    logo: IconType;
    title: string;
    date: string;
    color: string;
    description: string;
    children?: TimelineDataEntry[];
}

/**
 * TimelineProps interface.
 * @interface TimelineProps
 * @property {IconType} logo - The logo of the timeline.
 * @property {string} title - The title of the timeline.
 * @property {string} date - The date of the timeline.
 * @property {string} color - The color of the timeline.
 * @property {number} index - The index of the timeline.
 * @property {number} arrLength - The length of the timeline.
 * @property {TimelineDataEntry[]} children - The children of the timeline.
 */
export interface TimelineProperties {
    logo: IconType;
    title: string;
    date: string;
    color: string;
    index: number;
    arrLength: number;
    description: string;
    children?: TimelineDataEntry[];
}

/**
 * TimelinePanelProps interface.
 * @interface TimelinePanelProps
 * @property {TimelineDataEntry[]} timelineData - The timeline data.
 */
export interface TimelinePanelProperties {
    timelineData: TimelineDataEntry[];
}

/**
 * Timeline Component.
 * @param {TimelineProps} properties - The properties of the component.
 * @returns {JSX.Element} The Timeline component.
 */
function Timeline({
    logo,
    title,
    date,
    color,
    index,
    arrLength,
    children,
    description,
}: Readonly<TimelineProperties>): JSX.Element {
    const textColor = useColorModeValue('gray.700', 'white.300');
    const iconColor = color;
    const lineColor = useColorModeValue('gray.200', 'gray.600');


    const shouldShowLine = index <= arrLength - 1 || (children !== undefined && children?.length > 0);
    const lineEnd = index === arrLength - 1 ? '15px' : '50%';

    return (
        <Flex direction='column' mb='5px'>

            <Flex alignItems='center' minH='78px' justifyContent='start' position='relative'>
                <Flex direction='column' h='100%' alignItems='center' mr='12px' position='relative'>
                    <Icon as={logo} color={iconColor} h='30px' w='26px' zIndex='1' />

                    {shouldShowLine && (
                        <Box
                            w='2px'
                            bg={lineColor}
                            h={lineEnd}
                            position='absolute'
                            left='50%'
                            transform='translateX(-50%)'
                            top='50%'
                        />
                    )}
                </Flex>
                <Flex direction='column' justifyContent='flex-start' pl='2rem'>
                    <Text fontSize='sm' color={textColor} fontWeight='bold'>
                        {title}
                    </Text>
                    <Text fontSize='sm' color='gray.400' fontWeight='normal'>
                        {date}
                    </Text>
                    {description && (
                        <Text fontSize='sm' color='gray.500' fontWeight='normal' mt='1'>
                            {description}
                        </Text>
                    )}
                </Flex>
            </Flex>

            {children && (
                <Flex direction='column' pl='4rem' position='relative'>
               
                    {children.map((child, childIndex) => (
                        <Timeline
                            key={`${child.date}-${childIndex}`}
                            {...child}
                            index={childIndex}
                            arrLength={children.length}
                        />
                    ))}
                </Flex>
            )}
        </Flex>
    );
}

/**
 * TimelineRow Component.
 * @param {TimelinePanelProps} properties - The properties of the component.
 * @returns {JSX.Element} The TimelineRow component.
 */
function TimelinePanel({ timelineData }: Readonly<TimelinePanelProperties>): JSX.Element {
    const textColor = useColorModeValue('gray.700', 'white.300');
    const bg = useColorModeValue('gray.50', 'gray.700');

    return (
        <Card p='1rem' maxHeight='100%' bg={bg}>
            <CardHeader pt='0px' p='28px 0px 35px 21px'>
                <Flex direction='column'>
                    <Text fontSize='lg' color={textColor} fontWeight='bold' pb='.5rem'>
                        Development Timeline
                    </Text>
                    <Text fontSize='sm' color='gray.400' fontWeight='normal'>
                        Overview of key milestones and sub-tasks.
                    </Text>
                </Flex>
            </CardHeader>
            <CardBody ps='26px' pe='0px' mb='31px' position='relative'>
                <Flex direction='column'>
                    {timelineData.map((row, index) => (
                        <Timeline key={row.date} {...row} index={index} arrLength={timelineData.length} />
                    ))}
                </Flex>
            </CardBody>
        </Card>
    );
}

export default TimelinePanel;
