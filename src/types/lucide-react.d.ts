declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  }
  
  export const MessageSquare: FC<IconProps>;
  export const Users: FC<IconProps>;
  export const ArrowLeft: FC<IconProps>;
  export const Trophy: FC<IconProps>;
  // Add other icons as needed
} 