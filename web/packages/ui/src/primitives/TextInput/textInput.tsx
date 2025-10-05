import React from 'react';
import { TextInput as CarbonTextInput, TextInputProps } from '@carbon/react';

/**
 * Carbon TextInput wrapper
 * - uses Carbon tokens and default sizing
 * - explicitly sets generic so TS doesn’t complain
 */
export interface AppTextInputProps extends TextInputProps {
  size?: TextInputProps['size'];
}

export const TextInput: React.FC<AppTextInputProps> = ({
  size = 'sm',
  ...rest
}) => {
  return <CarbonTextInput size={size} {...rest} />;
};
