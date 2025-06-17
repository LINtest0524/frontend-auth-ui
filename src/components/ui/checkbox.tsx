// src/components/ui/checkbox.tsx
import * as React from 'react'
import { Checkbox as ShadcnCheckbox } from '@radix-ui/react-checkbox'

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof ShadcnCheckbox>,
  React.ComponentPropsWithoutRef<typeof ShadcnCheckbox>
>((props, ref) => {
  return (
    <ShadcnCheckbox
      ref={ref}
      className="h-4 w-4 rounded border border-gray-300 bg-white"
      {...props}
    />
  )
})
Checkbox.displayName = 'Checkbox'
