import { useGesture } from "@use-gesture/react";
import { localPoint } from "@visx/event";
import { Point } from "@visx/zoom/lib/types";
import { useState } from "react";
import { SelectionResult } from "./Lasso";
import "./RectangularSelection.css";

function RectangularSelection({
    svgElementRef,
    onSelectionExpand,
    onSelectionFinish,
}: {
    svgElementRef: React.MutableRefObject<SVGSVGElement>;
    onSelectionExpand: (result: SelectionResult) => void;
    onSelectionFinish: (result: SelectionResult) => void;
}) {
    const [startPoint, setStartPoint] = useState<Point | null>(null);
    const [endPoint, setEndPoint] = useState<Point | null>(null);

    const rectangle: Point[] =
        startPoint && endPoint
            ? [
                  startPoint,
                  {
                      x: startPoint.x,
                      y: endPoint.y,
                  },
                  endPoint,
                  {
                      x: endPoint.x,
                      y: startPoint.y,
                  },
              ]
            : [];

    useGesture(
        {
            onDragStart: ({ event }) => {
                if (!(event instanceof KeyboardEvent) && !(event instanceof TouchEvent)) {
                    setStartPoint(localPoint(event));
                }
            },
            onDrag: ({ event, pinching, cancel }) => {
                if (pinching) {
                    cancel();
                } else if (!(event instanceof KeyboardEvent) && !(event instanceof TouchEvent)) {
                    onSelectionExpand(rectangle);
                    setEndPoint(localPoint(event));
                }
            },
            onDragEnd: () => {
                onSelectionFinish(rectangle);
                setStartPoint(null);
                setEndPoint(null);
            },
        },
        { target: svgElementRef, eventOptions: { passive: false }, drag: { filterTaps: true } }
    );

    return (
        <g className="rectangle">
            {rectangle.length > 0 && <polygon points={rectangle.map((point) => `${point.x},${point.y}`).join(" ")} />}
        </g>
    );
}

export default RectangularSelection;
