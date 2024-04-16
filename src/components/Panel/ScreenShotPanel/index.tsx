import React from 'react';
import { Box, Grid, chakra, Stack, Image, useColorModeValue, keyframes, Button } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

interface ScreenShotPanelProperties {
    isImageOnLeft: boolean;
    title: string;
    subtitle: string;
    description: string;
    imageUrl: string;
    imageAlt: string;
    imageMaxHeight?: string;
    scaleImage?: 'height' | 'proportional';
    buttonText?: string;
    buttonLink?: string;
    buttonIcon?: React.ElementType;
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

/**
 * ScreenShotPanel component.
 * @param {ScreenShotPanelProperties} properties - The properties of the component.
 * @returns {JSX.Element} The `ScreenShotPanel` component.
 */
function ScreenShotPanel({
    isImageOnLeft,
    title,
    subtitle,
    description,
    imageUrl,
    imageAlt,
    imageMaxHeight = '60vh',
    scaleImage = 'height',
    buttonText,
    buttonLink,
    buttonIcon: ButtonIcon,
}: Readonly<ScreenShotPanelProperties>): JSX.Element {
    const bgColor = useColorModeValue('brand.500', 'gray.800');
    const textColor = useColorModeValue('gray.800', 'gray.100');
    const secondaryColor = useColorModeValue('gray.600', 'gray.400');
    const hoverColor = useColorModeValue('brand.700', 'brand.600');
    let imageStyle = {};
    if (scaleImage === 'height') {
        imageStyle = { maxHeight: imageMaxHeight };
    } else if (scaleImage === 'proportional') {
        imageStyle = { width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: imageMaxHeight };
    }

    const textFadeIn = keyframes`
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    `;

    return (
        <Grid
            templateColumns={{ md: '1fr 1fr' }}
            gap={6}
            bg={bgColor}
            px={8}
            py={24}
            mx='auto'
            animation={`${fadeIn} 0.8s ease`}
        >
            <Box order={isImageOnLeft ? 2 : 1} display='flex' flexDirection='column' justifyContent='center'>
                <chakra.h2
                    fontSize={{ base: '3xl', sm: '4xl' }}
                    fontWeight='extrabold'
                    lineHeight='shorter'
                    color={textColor}
                    mb={2}
                    textShadow='1px 1px 3px rgba(0, 0, 0, 0.2)'
                    _hover={{ color: hoverColor, textShadow: '1px 1px 5px rgba(0, 0, 0, 0.3)' }}
                >
                    {title}
                </chakra.h2>
                <chakra.span
                    display='block'
                    color={secondaryColor}
                    mb={4}
                    fontSize='xl'
                    fontWeight='bold'
                    textShadow='1px 1px 2px rgba(0, 0, 0, 0.1)'
                >
                    {subtitle}
                </chakra.span>
                <chakra.p
                    mb={6}
                    fontSize={{ base: 'lg', md: 'xl' }}
                    color={textColor}
                    animation={`${textFadeIn} 1s ease-out`}
                >
                    {description}
                </chakra.p>
                <Stack
                    direction={{ base: 'column', sm: 'row' }}
                    mb={{ base: 4, md: 8 }}
                    spacing={2}
                    justifyContent='center'
                    width='full'
                >
                    {buttonText !== null && buttonLink !== null && (
                        <Button
                            as={RouterLink}
                            to={buttonLink}
                            colorScheme='teal'
                            variant='outline'
                            rightIcon={ButtonIcon === undefined ? undefined : <ButtonIcon />}
                        >
                            {buttonText}
                        </Button>
                    )}
                </Stack>
            </Box>
            <Box order={isImageOnLeft ? 1 : 2} display='flex' justifyContent='center' alignItems='center'>
                <Image
                    rounded='lg'
                    shadow='2xl'
                    src={imageUrl}
                    alt={imageAlt}
                    {...imageStyle}
                    transition='transform 0.3s ease'
                    _hover={{ transform: 'scale(1.05)' }}
                />
            </Box>
        </Grid>
    );
}

export default ScreenShotPanel;
