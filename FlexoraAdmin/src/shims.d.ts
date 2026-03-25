declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module 'react' {
  export type ReactNode = any;
  export type ReactElement = any;
  export type FormEvent = any;
  export function createContext<T>(defaultValue: T): any;
  export function useContext<T>(context: any): T;
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  export function useState<T>(initial: T | (() => T)): [T, (v: any) => void];
  export function useEffect(effect: () => any, deps?: any[]): void;
  const React: {
    StrictMode: any;
  };
  export default React;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module 'react-dom/client' {
  export function createRoot(container: any): {
    render(node: any): void;
  };
}

declare module 'react-router-dom' {
  export const BrowserRouter: any;
  export const Routes: any;
  export const Route: any;
  export const Navigate: any;
  export const Outlet: any;
  export const NavLink: any;
  export function useNavigate(): (path: string, opts?: any) => void;
}
