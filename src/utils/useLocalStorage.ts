import { useEffect, useState } from "react";

export const useLocalStorage = (key:any, defaultValue:any) => {
    const [value, setValue] = useState(defaultValue);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        try {
            const item = localStorage.getItem(key);
            if (item !== null) {
                setValue(item === "true" ? true : item === "false" ? false : item);
            }
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
        }
    }, [key]);

    const setStoredValue = (newValue:any) => {
        try {
            setValue(newValue);
            if (mounted) {
                localStorage.setItem(key, newValue.toString());
            }
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    };

    return [value, setStoredValue, mounted];
};
