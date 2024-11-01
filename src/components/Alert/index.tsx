import React from 'react';
import { position, useToast, Fade } from '@chakra-ui/react';
import AlertBody, { AlertBodyProperties } from './alert-body';

/**
 * CustomAlertProperties interface.
 * @interface CustomAlertProperties
 * @extends AlertBodyProperties
 * @property {number} [duration] - toast duration.
 * @property {boolean} [isToast] - whether the alert is a toast.
 * @property {'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'} [position] - toast position.
 */
export interface CustomAlertProperties extends AlertBodyProperties {
    duration?: number;
    isToast?: boolean;
    position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * CustomAlert component to show a toast notification.
 * @param {CustomAlertProperties} props - The properties of the component.
 * @returns {JSX.Element | undefined } The CustomAlert component.
 */
function CustomAlert(props: CustomAlertProperties): JSX.Element | undefined {
    const { duration = 5000, isClosable = true, isToast = true, ...alertProps } = props;
    const [visible, setVisible] = React.useState(true);
    const toast = useToast();

    React.useEffect(() => {
        if (isToast) {
            toast({
                duration,
                isClosable,
                position: 'bottom',
                render: ({ onClose }) => <AlertBody {...alertProps} isClosable={isClosable} onClose={onClose} />,
            });
        }
    }, [toast, duration, isClosable, alertProps, useToast, position]);

    if (!isToast) {
        const handleClose = (): void => {
            setVisible(false);
        };

        return (
            <Fade in={visible} unmountOnExit transition={{ enter: { duration: 0.3 }, exit: { duration: 0.5 } }}>
                <AlertBody {...alertProps} isClosable={isClosable} onClose={handleClose} />
            </Fade>
        );
    }

    return undefined;
}

export default CustomAlert;
