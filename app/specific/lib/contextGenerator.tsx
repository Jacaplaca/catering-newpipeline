import { createContext, useContext, type ReactNode } from "react";
import { ContextDevTool } from 'react-context-devtool';

type StoreType<T> = T;
type ContextType<T> = T | undefined;

export const createGenericContext = <T,>(
    contextName: string,
    errorMessage: string
) => {
    const Context = createContext<ContextType<T>>(undefined);
    Context.displayName = contextName;

    const ContextProvider = ({
        children,
        store,
    }: { children: ReactNode, store: StoreType<T> }) => {
        return (
            <Context.Provider value={store}>
                {children}
                <ContextDevTool context={Context} id={contextName} displayName={contextName} />
            </Context.Provider>
        );
    };

    const useGenericContext = (): T => {
        const context = useContext(Context);
        if (context === undefined) {
            throw new Error(errorMessage);
        }
        return context;
    };

    return { ContextProvider, useGenericContext };
};