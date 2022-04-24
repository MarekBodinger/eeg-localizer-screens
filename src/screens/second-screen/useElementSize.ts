import { useMemo } from "react";

export function useElementSize(ref: React.RefObject<HTMLElement>) {
    const size = useMemo<{ width: number; height: number } | null>(() => {
        if (!ref.current) {
            return null;
        }
        return { width: ref.current.getBoundingClientRect().width, height: ref.current.getBoundingClientRect().height };
    }, [ref.current]);

    return size;
}
