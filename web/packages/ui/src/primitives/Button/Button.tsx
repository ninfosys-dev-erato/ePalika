import { Button as CarbonButton, ButtonProps } from '@carbon/react';
import React from 'react';

/**
 * Carbon Button wrapper
 * - explicitly sets default element type to "button"
 */
export interface AppButtonProps extends ButtonProps<'button'> {
  kind?: ButtonProps<'button'>['kind'];
  size?: ButtonProps<'button'>['size'];
}

export const Button: React.FC<AppButtonProps> = ({
  size = 'sm',
  kind = 'primary',
  ...rest
}) => {
  return <CarbonButton size={size} kind={kind} {...rest} />;
};
