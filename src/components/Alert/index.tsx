import React from 'react';
import { useToast, Flex, Icon, Box, chakra, Avatar, CloseButton } from '@chakra-ui/react';
import { IoMdCheckmarkCircle, IoMdAlert } from 'react-icons/io';
import { BsLightningFill } from 'react-icons/bs';

interface CustomAlertProperties {
    type: 'success' | 'info' | 'warning' | 'error' | 'notification';
    title: string;
    description: string;
    avatarSrc?: string;
    avatarName?: string;
    isClosable?: boolean;
}

const bgColors = {
    success: 'green.500',
    info: 'blue.500',
    warning: 'yellow.500',
    error: 'red.500',
    notification: 'gray.800',
};

/**
 * CustomAlert component.
 * @param {CustomAlertProperties} properties - The properties of the component.
 * @returns {undefined} Since the toast is being handled by useToast, we don't need to return anything here.
 */
function CustomAlert({
    type,
    title,
    description,
    avatarSrc,
    avatarName,
    isClosable = true,
}: CustomAlertProperties): undefined {
    const toast = useToast();

    const icons = React.useMemo(
        () => ({
            success: <Icon as={IoMdCheckmarkCircle} color='white' boxSize={6} />,
            info: <Icon as={IoMdAlert} color='white' boxSize={6} />,
            warning: <Icon as={IoMdAlert} color='white' boxSize={6} />,
            error: <Icon as={BsLightningFill} color='white' boxSize={6} />,
            notification: <Avatar boxSize={10} name={avatarName ?? ''} src={avatarSrc ?? ''} />,
        }),
        [avatarName, avatarSrc],
    );
    React.useEffect(() => {
        toast({
            duration: 5000,
            isClosable,
            render: ({ onClose }) => (
                <Flex
                    maxW='sm'
                    w='full'
                    bg='white'
                    _dark={{ bg: 'gray.800' }}
                    rounded='lg'
                    overflow='hidden'
                    shadow='md'
                    position='relative'
                >
                    <Flex justifyContent='center' alignItems='center' w={12} bg={bgColors[type]}>
                        {icons[type]}
                    </Flex>

                    <Box mx={-3} py={2} px={4}>
                        <Box mx={3}>
                            <chakra.span color={`${bgColors[type]}.400`} fontWeight='bold'>
                                {title}
                            </chakra.span>
                            <chakra.p color='gray.600' _dark={{ color: 'gray.200' }} fontSize='sm'>
                                {description}
                            </chakra.p>
                        </Box>
                    </Box>
                    {isClosable && (
                        <CloseButton
                            position='absolute'
                            right='4'
                            top='50%'
                            transform='translateY(-50%)'
                            onClick={onClose}
                        />
                    )}
                </Flex>
            ),
        });
    }, [toast, type, title, description, avatarSrc, avatarName, isClosable, icons]);

    return undefined; // Since the toast is being handled by useToast, we don't need to return anything here.
}

export default CustomAlert;
