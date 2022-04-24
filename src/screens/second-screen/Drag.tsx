import { useGesture } from "@use-gesture/react";
import { localPoint } from "@visx/event";
import { Point, ProvidedZoom } from "@visx/zoom/lib/types";
import { RefObject, useRef, useState } from "react";

interface Child<ElementType> {
    ref: RefObject<ElementType>;
    x: number;
    y: number;
}

function Drag<ElementType extends Element>({
    children,
    point,
    zoom,
    onDragPointEnd,
    enabled,
    isPointInsideTheImage,
}: {
    children: (child: Child<ElementType>) => React.ReactNode;
    point: Point;
    zoom: ProvidedZoom<SVGSVGElement>;
    onDragPointEnd: (newPoint: Point) => void;
    enabled: boolean;
    isPointInsideTheImage: (x: number, y: number) => boolean;
}) {
    const containerRef = useRef<ElementType>(null);
    const [newPoint, setNewPoint] = useState<Point | null>();

    useGesture(
        {
            onDrag: ({ event }) => {
                if (event instanceof KeyboardEvent || !enabled) {
                    return;
                }
                const imagePoint = zoom.applyInverseToPoint(localPoint(event) as Point);
                if (!isPointInsideTheImage(imagePoint.x, imagePoint.y)) {
                    return;
                }
                setNewPoint(imagePoint);
            },
            onDragEnd: () => {
                if (newPoint) {
                    onDragPointEnd(newPoint);
                }
            },
        },
        { target: containerRef, eventOptions: { passive: false }, drag: { filterTaps: true } }
    );

    return <>{children({ ref: containerRef, x: newPoint?.x ?? point.x, y: newPoint?.y ?? point.y })}</>;
}

export default Drag;
