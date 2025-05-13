
import * as ReactNamespace from 'react';

declare module 'react' {
  export = ReactNamespace;
  export as namespace React;
}

declare module 'react/jsx-runtime' {
  export * from 'react/jsx-runtime';
}
