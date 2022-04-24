import { useEffect, useState } from "react";
import reactImageSize from "react-image-size";

export function useImageSize(url: string | null) {
    const [size, setSize] = useState<{ height: number; width: number } | null>(null);

    useEffect(() => {
        (async () => {
            const size = url ? await reactImageSize(url) : null;
            setSize(size ? { width: size.width, height: size.height } : null);
        })();
    }, [url]);

    return size;
}
