/* eslint react/jsx-handler-names: "off" */
import ArrowLeftIcon from "@heroicons/react/solid/ArrowLeftIcon";
import CursorClickIcon from "@heroicons/react/solid/CursorClickIcon";
import { localPoint } from "@visx/event";
import { scaleLinear } from "@visx/scale";
import { Zoom } from "@visx/zoom";
import { Point, ProvidedZoom, TransformMatrix } from "@visx/zoom/lib/types";
import produce from "immer";
import React, { useMemo, useRef, useState } from "react";
import classifyPoint from "robust-point-in-polygon";
import Box from "../components/Box";
import Drag from "./second-screen/Drag";
import Lasso, { SelectionResult } from "./second-screen/Lasso";
import LassoPng from "./second-screen/lasso.png";
import RectangleSvg from "./second-screen/rectangle.svg";
import RectangularSelection from "./second-screen/RectangularSelection";

const bg = "#0a0a0a";

const sizeScale = scaleLinear<number>({ domain: [0, 600], range: [5, 15] });

enum Mode {
    Default,
    LassoSelection,
    RectangularSelection,
}

const getInitialTransform = (parentWidth: number, parentHeight: number, imageWidth: number, imageHeight: number) => {
    const scale = Math.min(parentWidth / (imageWidth * 1.1), parentHeight / (imageHeight * 1.1));
    const scaledImageWidth = imageWidth * scale;
    const scaledImageHeight = imageHeight * scale;
    const translateX = (parentWidth - scaledImageWidth) / 2;
    const translateY = (parentHeight - scaledImageHeight) / 2;

    return {
        scaleX: scale,
        scaleY: scale,
        translateX,
        translateY,
        skewX: 0,
        skewY: 0,
    } as TransformMatrix;
};

function LassoIcon() {
    return <img className="h-5 w-5 text-gray-800 m-2" src={LassoPng} />;
}

function RectangleIcon() {
    return <img className="h-5 w-5 text-gray-800 m-2" src={RectangleSvg} />;
}

export type SecondScreenElectrode = [number, number];

export type SecondScreenProps = {
    parentWidth: number;
    parentHeight: number;
    imageWidth: number;
    imageHeight: number;
    url: string;
    electrodes: SecondScreenElectrode[];
};

export default function SecondScreen({
    parentWidth,
    parentHeight,
    imageWidth,
    imageHeight,
    url,
    electrodes,
}: SecondScreenProps) {
    const initialTransform = useMemo(
        () => getInitialTransform(parentWidth, parentHeight, imageWidth, imageHeight),
        [parentWidth, parentHeight, imageWidth, imageHeight]
    );

    const [mode, setMode] = useState(Mode.Default);
    const isDragging = useRef(false);
    const svgRef = useRef<SVGSVGElement>() as any;

    const [electrodesMapped, setElectrodesMapped] = useState(
        electrodes.map(([x, y]) => ({ x, y, selected: false, possiblySelected: false }))
    );

    const onSelection = (result: SelectionResult, zoom: ProvidedZoom<SVGSVGElement>, type: "expand" | "finish") => {
        const mapped = result
            .map((point) => zoom.applyInverseToPoint(point))
            .map((a) => [a?.x, a?.y] as [number, number]);

        const pointsToSelect = electrodesMapped.map((point, index) => {
            const isPointInside = classifyPoint(mapped, [point.x, point.y]) === -1;

            return isPointInside ? index : null;
        });
        selectPoints(pointsToSelect, type);
    };

    const selectPoints = (indexes: (number | null)[], type: "expand" | "finish" = "finish") => {
        const newElectrodes = produce(electrodesMapped, (draft) => {
            draft.forEach((electrode, index) => {
                const isElectrodeInIndexes = indexes.includes(index);
                switch (type) {
                    case "expand":
                        if (isElectrodeInIndexes) {
                            electrode.possiblySelected = true;
                        }
                        break;
                    case "finish":
                        electrode.possiblySelected = false;
                        electrode.selected = isElectrodeInIndexes;
                        break;
                }
            });
        });
        setElectrodesMapped(newElectrodes);
    };

    const isPointInsideTheImage = useMemo(
        () => (x: number, y: number) => {
            return 0 <= x && x <= imageWidth && 0 <= y && y <= imageHeight;
        },
        [imageWidth, imageHeight]
    );

    const handleDragPointEnd = (newPoint: Point, index: number) => {
        const newPoints = produce(electrodesMapped, (draft) => {
            draft[index].x = newPoint.x;
            draft[index].y = newPoint.y;
        });
        setElectrodesMapped(newPoints);
    };

    const handleAddElectrode = (
        event: React.MouseEvent<SVGRectElement, MouseEvent>,
        zoom: ProvidedZoom<SVGSVGElement>
    ) => {
        // todo: dont allow adding point outside image
        const { x, y } = zoom.applyInverseToPoint(localPoint(event) as Point);
        if (!isPointInsideTheImage(x, y)) {
            return;
        }
        console.log(x, y);
        const newPoints = produce(electrodesMapped, (draft) => {
            draft.push({
                x,
                y,
                selected: false,
                possiblySelected: false,
            });
        });
        setElectrodesMapped(newPoints);
    };

    const handleElectrodeMouseDown = (index: number) => {
        selectPoints([index]);
    };

    const selectedElectrodesCount = electrodesMapped.filter((electrode) => electrode.selected).length;

    const handleRemoveSelectedElectrodes = () => {
        setElectrodesMapped(electrodesMapped.filter((x) => !x.selected));
    };

    return (
        <div className="relative w-screen h-screen">
            <div className="fixed top-5 left-5 mx-auto bg-white hover:bg-gray-300 rounded-full overflow-hidden cursor-pointer">
                <ArrowLeftIcon className="h-5 w-5 text-gray-800 m-2 hover:text-gray-600" />
            </div>

            <div className="fixed bottom-5 left-5 flex">
                {[
                    { mode: Mode.Default, component: CursorClickIcon },
                    { mode: Mode.LassoSelection, component: LassoIcon },
                    { mode: Mode.RectangularSelection, component: RectangleIcon },
                ].map((x) => (
                    <div
                        className={`mx-auto ${
                            mode === x.mode ? "bg-gray-500" : "bg-white hover:bg-gray-300"
                        } rounded-full overflow-hidden cursor-pointer mr-3 hover:text-gray-600`}
                        onClick={() => setMode(x.mode)}
                    >
                        <x.component className="h-5 w-5 text-gray-800 m-2" />
                    </div>
                ))}
            </div>

            <div className="fixed bottom-5 right-5">
                <Box>
                    <>
                        <div className="block text-lg leading-tight font-medium text-black mb-3">
                            Add/remove electrodes
                        </div>
                        <div
                            className={`flex items-center justify-between text-md leading-tight text-gray-600 p-2 bg-gray-200 rounded-xl mb-3`}
                        >
                            <span>
                                {selectedElectrodesCount} of out {electrodesMapped.length} selected
                            </span>
                            {selectedElectrodesCount > 0 && (
                                <button
                                    className={`${"bg-red-400 hover:bg-red-500 text-white"} py-1 px-2 rounded-xl `}
                                    onClick={handleRemoveSelectedElectrodes}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                        <div className="flex justify-end">
                            <button
                                className={`${"bg-green-400 hover:bg-green-500 text-white font-bold"} py-2 px-4 rounded-xl mt-2`}
                            >
                                Done
                            </button>
                        </div>
                    </>
                </Box>
            </div>
            <Zoom<SVGSVGElement>
                width={parentWidth}
                height={parentHeight}
                scaleXMin={initialTransform.scaleX / 2}
                scaleXMax={initialTransform.scaleX * 16}
                scaleYMin={initialTransform.scaleX / 2}
                scaleYMax={initialTransform.scaleX * 16}
                initialTransformMatrix={initialTransform}
            >
                {(zoom) => {
                    const proceedIfDefaultMode = <T extends unknown>(callback: T) => {
                        return mode === Mode.Default ? callback : () => {};
                    };

                    return (
                        <>
                            <svg
                                className="w-full h-full"
                                style={{ cursor: isDragging.current ? "grabbing" : "initial", touchAction: "none" }}
                                // ref={mode === Mode.Dragging ? zoom.containerRef : svgRef}
                                ref={svgRef as any}
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                /* Background */
                                <rect width="100%" height="100%" fill={bg} />
                                /* Image */
                                <g transform={zoom.toString()}>
                                    <image
                                        href={url}
                                        height={imageHeight}
                                        width={imageWidth}
                                        style={{ filter: "grayscale(1)" }}
                                    />
                                </g>
                                /* Zoom rectangle */
                                <rect
                                    width="100%"
                                    height="100%"
                                    fill="transparent"
                                    onTouchStart={proceedIfDefaultMode(zoom.dragStart)}
                                    onTouchMove={proceedIfDefaultMode(zoom.dragMove)}
                                    onTouchEnd={proceedIfDefaultMode(zoom.dragEnd)}
                                    onMouseDown={proceedIfDefaultMode((e) => {
                                        isDragging.current = false;
                                        zoom.dragStart(e);
                                    })}
                                    onMouseMove={proceedIfDefaultMode((e) => {
                                        isDragging.current = true;
                                        zoom.dragMove(e);
                                    })}
                                    onMouseUp={proceedIfDefaultMode((e) => {
                                        if (!isDragging.current) {
                                            handleAddElectrode(e, zoom);
                                        }
                                        isDragging.current = false;
                                        zoom.dragEnd();
                                    })}
                                    onMouseLeave={proceedIfDefaultMode(() => {
                                        zoom.dragEnd();
                                    })}
                                    onDoubleClick={(e) => {
                                        const point = localPoint(e) || { x: 0, y: 0 };
                                        zoom.scale({ scaleX: 1.1, scaleY: 1.1, point });
                                    }}
                                    onWheel={zoom.handleWheel}
                                />
                                <g transform={zoom.toString()}>
                                    {electrodesMapped.map(({ x, y, selected, possiblySelected }, i) => (
                                        <Drag<SVGCircleElement>
                                            point={{ x, y }}
                                            zoom={zoom}
                                            enabled={mode === Mode.Default}
                                            onDragPointEnd={(newPoint) => handleDragPointEnd(newPoint, i)}
                                            isPointInsideTheImage={isPointInsideTheImage}
                                        >
                                            {({ ref, x, y }) => (
                                                <circle
                                                    cx={x}
                                                    cy={y}
                                                    // r={i > 500 ? sizeScale(1000 - i) : sizeScale(i)}
                                                    r={20}
                                                    fill={selected || possiblySelected ? "blue" : "red"}
                                                    ref={ref}
                                                    // TODO: explain is dragging screen can stop on hitting point
                                                    style={zoom.isDragging ? { pointerEvents: "none" } : {}}
                                                    // TODO: explain wheel
                                                    onMouseDown={() => handleElectrodeMouseDown(i)}
                                                    onWheel={zoom.handleWheel}
                                                />
                                            )}
                                        </Drag>
                                    ))}
                                </g>
                                {mode === Mode.LassoSelection && (
                                    <Lasso
                                        svgElementRef={svgRef}
                                        onSelectionExpand={(result) => onSelection(result, zoom, "expand")}
                                        onSelectionFinish={(result) => onSelection(result, zoom, "finish")}
                                    ></Lasso>
                                )}
                                {mode === Mode.RectangularSelection && (
                                    <RectangularSelection
                                        svgElementRef={svgRef}
                                        onSelectionExpand={(result) => onSelection(result, zoom, "expand")}
                                        onSelectionFinish={(result) => onSelection(result, zoom, "finish")}
                                    ></RectangularSelection>
                                )}
                            </svg>
                        </>
                    );
                }}
            </Zoom>
        </div>
    );
}
