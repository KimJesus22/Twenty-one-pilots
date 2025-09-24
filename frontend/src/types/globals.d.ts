// Declaraciones globales para módulos
declare module '*.css';
declare module '*.scss';
declare module '*.sass';
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.webp';
declare module '*.ico';
declare module '*.mp3';
declare module '*.mp4';
declare module '*.json';

// Declaraciones para React
declare namespace React {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // Extender con atributos personalizados si es necesario
  }
}