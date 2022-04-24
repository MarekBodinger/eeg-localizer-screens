import { useGesture } from "@use-gesture/react";
import { localPoint } from "@visx/event";
import { Point } from "@visx/zoom/lib/types";
import { useState } from "react";
import "./Lasso.css";

export type SelectionResult = Point[];

function Lasso({
    svgElementRef,
    onSelectionExpand,
    onSelectionFinish,
}: {
    svgElementRef: React.MutableRefObject<SVGSVGElement>;
    onSelectionExpand: (result: SelectionResult) => void;
    onSelectionFinish: (result: SelectionResult) => void;
}) {
    const [selectionResult, setSelectionResult] = useState<SelectionResult>([]);
    const d = selectionResult
        .map(({ x, y }, index) => {
            return `${index === 0 ? "M" : "L"} ${x} ${y}`;
        })
        .join(" ");

    useGesture(
        {
            onDrag: ({ event, pinching, cancel }) => {
                if (pinching) {
                    cancel();
                } else if (!(event instanceof KeyboardEvent) && !(event instanceof TouchEvent)) {
                    const newX = [...selectionResult, localPoint(event)] as SelectionResult;
                    setSelectionResult(newX);
                    onSelectionFinish(newX);
                }
            },
            onDragEnd: () => {
                onSelectionExpand(selectionResult);
                setSelectionResult([]);
            },
        },
        { target: svgElementRef, eventOptions: { passive: false }, drag: { filterTaps: true } }
    );

    return (
        <g className="lasso">
            <path className="drawn" d={d}></path>
        </g>
    );
}

export default Lasso;
