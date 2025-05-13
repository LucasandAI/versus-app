
declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  }
  
  // Basic navigation icons
  export const Home: FC<IconProps>;
  export const User: FC<IconProps>;
  export const Users: FC<IconProps>;
  export const UsersRound: FC<IconProps>;
  export const MessageSquare: FC<IconProps>;
  export const ArrowLeft: FC<IconProps>;
  export const Trophy: FC<IconProps>;
  export const ChevronDown: FC<IconProps>;
  
  // Action icons
  export const Edit: FC<IconProps>;
  export const Trash: FC<IconProps>;
  export const Send: FC<IconProps>;
  export const Save: FC<IconProps>;
  export const Upload: FC<IconProps>;
  export const Settings: FC<IconProps>;
  export const Search: FC<IconProps>;
  export const X: FC<IconProps>;
  
  // User management icons
  export const UserMinus: FC<IconProps>;
  export const UserCog: FC<IconProps>;
  export const UserX: FC<IconProps>;
  
  // Security/admin icons
  export const ShieldAlert: FC<IconProps>;
  export const ShieldCheck: FC<IconProps>;
  export const ShieldX: FC<IconProps>;
  
  // Status/loader icons
  export const Loader2: FC<IconProps>;
  export const Watch: FC<IconProps>;
}
