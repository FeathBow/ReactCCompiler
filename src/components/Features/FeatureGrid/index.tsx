import {
    Box,
    Flex,
    chakra,
    SimpleGrid,
    Stack,
    Icon,
    GridItem,
    useColorModeValue,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    Button,
    keyframes,
} from '@chakra-ui/react';
import React from 'react';
import CodeModal from 'Components/OutModal/CodeModal';

interface FeatureProperties {
    title: string;
    description: string;
    example: string;
    result: string;
    icon: React.ElementType;
    iconColor?: string;
    showDetails?: boolean;
    contentType?: string;
}

Feature.defaultProps = {
    iconColor: undefined,
    showDetails: false,
    contentType: 'text',
};

/**
 * Feature component.
 * @param {FeatureProperties} props - The props.
 * @returns {JSX.Element} The rendered Feature component.
 */
function Feature({
    title,
    description,
    example,
    result,
    icon: IconComponent,
    iconColor,
    showDetails,
    contentType = 'text',
}: Readonly<FeatureProperties>): JSX.Element {
    const titleColor = useColorModeValue('gray.800', 'white');
    const textColor = useColorModeValue('gray.500', 'gray.300');
    const detailColor = useColorModeValue('gray.600', 'gray.400');
    const exampleBg = useColorModeValue('gray.100', 'gray.700');
    const boxBorderColor = useColorModeValue('gray.300', 'gray.600');
    const modalBg = useColorModeValue('gray.100', 'gray.800');

    const modalDetailColor = useColorModeValue('teal.500', 'teal.200');
    const { isOpen, onOpen, onClose } = useDisclosure();
    const renderContent = (): JSX.Element => {
        if (contentType === 'code') {
            return <CodeModal isOpen={isOpen} onClose={onClose} code={example} result={result} />;
        }
        return (
            <Box>
                <chakra.p fontWeight='bold'>{example}</chakra.p>
                <chakra.p fontWeight='semibold'>{result}</chakra.p>
            </Box>
        );
    };
    return (
        <Flex justifyContent='center' align='start' mb={5} >
            <Icon
                as={IconComponent}
                boxSize={6}
                mt={1}
                mr={3}
                color={iconColor ?? 'green.500'}
                cursor='pointer'
                _hover={{ transform: 'scale(1.1)' }}
                onClick={onOpen}
            />
            <Box flex='1'>
                <chakra.dt fontSize='xl' fontWeight='bold' lineHeight='normal' color={titleColor}>
                    {title}
                </chakra.dt>
                <chakra.dd mt={2} fontSize='md' color={textColor}>
                    {description}
                </chakra.dd>
                {showDetails === true && (
                    <Box>
                        <Box
                            mt={2}
                            p={3}
                            bg={exampleBg}
                            borderRadius='md'
                            border='1px solid'
                            borderColor={boxBorderColor}
                            display='flex'
                            flexDirection='column'
                        >
                            <chakra.span fontSize='md' fontWeight='semibold' color={detailColor}>
                                Calculation: <chakra.span fontWeight='bold'>{example}</chakra.span>
                            </chakra.span>
                            <chakra.span mt={1} fontWeight='bold' color={detailColor}>
                                Outputs: <chakra.span fontWeight='semibold'>{result}</chakra.span>
                            </chakra.span>
                        </Box>
                        <Flex mt={3}>
                            <Button
                                width='fit-content'
                                onClick={onOpen}
                                colorScheme='teal'
                                variant='outline'
                                leftIcon={<Icon as={IconComponent} />}
                            >
                                Show Details
                            </Button>
                        </Flex>
                    </Box>
                )}
                <Modal isOpen={isOpen} onClose={onClose} isCentered size='lg'>
                    <ModalOverlay />
                    <ModalContent bg={modalBg} borderRadius='xl'>
                        <ModalHeader fontWeight='bold' fontSize='2xl' color={modalDetailColor}>
                            Explore {title}
                        </ModalHeader>
                        <ModalCloseButton color={modalDetailColor} />
                        <ModalBody>{renderContent()}</ModalBody>
                    </ModalContent>
                </Modal>
            </Box>
        </Flex>
    );
}

interface FeaturesGridProperties {
    features: FeatureProperties[];
    introductionText: string;
    introductionHeading: string;
    introductionPosition?: 'left' | 'right';
}

FeaturesGrid.defaultProps = {
    introductionPosition: 'left',
};

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

/**
 * FeaturesGrid component.
 * @param {FeaturesGridProperties} props - The props.
 * @returns {JSX.Element} The rendered FeaturesGrid component.
 */
function FeaturesGrid({
    features,
    introductionText,
    introductionHeading,
    introductionPosition = 'left',
}: Readonly<FeaturesGridProperties>): JSX.Element {
    const textColor = useColorModeValue('gray.900', 'gray.100');
    const bgColor = useColorModeValue('white', 'gray.800');
    const shadowStyle = useColorModeValue(
        '0px 10px 15px 3px rgba(0, 0, 0, 0.1), 0px 4px 6px 2px rgba(0, 0, 0, 0.05)',
        '0px 10px 15px 3px rgba(255, 255, 255, 0.1), 0px 4px 6px 2px rgba(255, 255, 255, 0.05)',
    );

    return (
        <Flex
            p={20}
            w='auto'
            justifyContent='space-between'
            direction='column'
            alignItems='center'
            animation={`${fadeIn} 0.8s ease`}
        >
            <Box
                transition='transform 0.3s ease'
                _hover={{ transform: 'scale(1.05)' }}
                shadow={shadowStyle}
                bg={bgColor}
                px={8}
                py={20}
                mx='auto'
                borderRadius='3xl'
            >
                <SimpleGrid columns={{ base: 1, lg: 3 }} spacingY={{ base: 8, lg: 16 }} spacingX={{ base: 8, lg: 12 }}>
                    <GridItem colSpan={{ base: 3, lg: 1 }} order={introductionPosition === 'right' ? 2 : 1}>
                        <chakra.h2
                            mb={3}
                            fontSize={{ base: '3xl', md: '4xl' }}
                            fontWeight='extrabold'
                            color={textColor}
                        >
                            {introductionHeading}
                        </chakra.h2>
                        <chakra.p mb={6} fontSize={{ base: 'lg', md: 'xl' }} color={textColor}>
                            {introductionText}
                        </chakra.p>
                    </GridItem>
                    <GridItem colSpan={2} order={introductionPosition === 'right' ? 1 : 2}>
                        <Stack
                            spacing={{ base: 10, md: 10 }}
                            display={{ md: 'grid' }}
                            gridTemplateColumns={{ md: 'repeat(auto-fit, minmax(300px, 1fr))' }}
                            gridColumnGap={{ md: 5 }}
                            gridRowGap={{ md: 5 }}
                        >
                            {features.map((feature) => (
                                <Box minH='50px' key={feature.title} alignSelf='start'>
                                    <Feature
                                        title={feature.title}
                                        description={feature.description}
                                        example={feature.example}
                                        result={feature.result}
                                        icon={feature.icon}
                                        iconColor={feature.iconColor}
                                        showDetails={feature.showDetails}
                                        contentType={feature.contentType}
                                    />
                                </Box>
                            ))}
                        </Stack>
                    </GridItem>
                </SimpleGrid>
            </Box>
        </Flex>
    );
}
export default FeaturesGrid;
