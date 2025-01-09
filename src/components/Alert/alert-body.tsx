import React from 'react';
import { Flex, Icon, Box, chakra, CloseButton, Avatar } from '@chakra-ui/react';
import { IoMdCheckmarkCircle, IoMdAlert } from 'react-icons/io';
import { BsLightningFill } from 'react-icons/bs';

/**
 * AlertBody properties.
 * @interface AlertBodyProperties
 * @property {string} type - The type of the alert.
 * @property {string} title - The title of the alert.
 * @property {string} description - The description of the alert.
 * @property {string} [avatarSrc] - The source of the avatar.
 * @property {string} [avatarName] - The name of the avatar.
 * @property {boolean} [isClosable] - Whether the alert is closable.
 * @property {() => void} [onClose] - The function to call when the alert is closed.
 * @property {boolean} [fullWidth] - Whether the alert is full width.
 */
export interface AlertBodyProperties {
    type: 'success' | 'info' | 'warning' | 'error' | 'notification';
    title: string;
    description: string;
    avatarSrc?: string;
    avatarName?: string;
    isClosable?: boolean;
    onClose?: () => void;
    fullWidth?: boolean;
}

const bgColors = {
    success: 'green',
    info: 'blue',
    warning: 'yellow',
    error: 'red',
    notification: 'gray',
};

/**
 * AlertBody component to show the body of the alert.
 * @param {AlertBodyProperties} properties - The properties of the component.
 * @returns {JSX.Element} The AlertBody component.
 */
function AlertBody({
    type,
    title,
    description,
    avatarSrc,
    avatarName,
    isClosable = true,
    onClose,
    fullWidth = false,
}: Readonly<AlertBodyProperties>): JSX.Element {
    const icons = {
        success: <Icon as={IoMdCheckmarkCircle} color='white' boxSize={6} />,
        info: <Icon as={IoMdAlert} color='white' boxSize={6} />,
        warning: <Icon as={IoMdAlert} color='white' boxSize={6} />,
        error: <Icon as={BsLightningFill} color='white' boxSize={6} />,
        notification: <Avatar boxSize={10} name={avatarName ?? ''} src={avatarSrc ?? ''} />,
    };
    const handleOnClose = onClose || (() => {});
    return (
        <Flex
            maxW={fullWidth ? '100%' : 'sm'}
            w='full'
            bg='white'
            _dark={{ bg: 'gray.800' }}
            rounded='lg'
            overflow='hidden'
            shadow='md'
            position='relative'
        >
            <Flex justifyContent='center' alignItems='center' w={12} bg={`${bgColors[type]}.500`}>
                {icons[type]}
            </Flex>

            <Box mx={-3} py={2} px={4}>
                <Box mx={3}>
                    <chakra.span color={`${bgColors[type]}.400`} fontWeight='bold' fontSize='lg'>
                        {title}
                    </chakra.span>
                    <chakra.p color='gray.600' _dark={{ color: 'gray.200' }} fontSize='sm' mt={1}>
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
                    onClick={handleOnClose}
                />
            )}
        </Flex>
    );
}

export default AlertBody;
