/// <reference types="vite/client" />

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.scss';

declare module '*.svg' {
  const src: string;
  export default src;
}
