import 'react-i18next';
import { ReactNode } from 'react';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    returnNull: false;
    returnEmptyString: false;
    returnObjects: false;
    joinArrays: false;
    allowObjectInHTMLChildren: false;
    resources: {
      translation: any;
    };
  }
  
  export interface TFunction {
    (key: string): string;
  }
}