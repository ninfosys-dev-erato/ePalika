import React from 'react';
import { Select as CarbonSelect, SelectItem, SelectProps } from '@carbon/react';

/**
 * Carbon Select wrapper
 * - thin layer with defaults
 */
export interface AppSelectOption {
  value: string;
  text: string;
}

export interface AppSelectProps extends Omit<SelectProps, 'children'> {
  options: AppSelectOption[];
}

export const Select: React.FC<AppSelectProps> = ({
  options,
  size = 'md',
  ...rest
}) => {
  return (
    <CarbonSelect size={size} {...rest}>
      {options.map(opt => (
        <SelectItem key={opt.value} value={opt.value} text={opt.text} />
      ))}
    </CarbonSelect>
  );
};
