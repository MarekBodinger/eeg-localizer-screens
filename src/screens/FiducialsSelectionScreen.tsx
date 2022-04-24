import { ArrowLeftIcon } from "@heroicons/react/solid";
import produce from "immer";
import { useState } from "react";
import Ball from "../components/Ball";
import Box from "../components/Box";
import ScreenLayout from "../components/ScreenLayout";
import FiducialsSelection from "./FiducialsSelection";

export interface FiducialPosition {
    x: number;
    y: number;
    z: number;
}

export interface Fiducial {
    name: string;
    color: string;
    position?: { x: number; y: number; z: number };
}

export type FiducialSelected = (index: number, position: FiducialPosition) => void;

const fiducialsList: Fiducial[] = [
    {
        name: "Nasion",
        color: "#ff00ff",
    },
    {
        name: "Right ear helix-tragus junction",
        color: "red",
    },
    {
        name: "Left ear helix-tragus junction",
        color: "#66dd99",
    },
];

function FiducialsSelectionScreen() {
    const [selectingFiducialIndex, setSelectingFiducialIndex] = useState(0);
    const [fiducials, setFiducials] = useState(fiducialsList);
    const [loading, setLoading] = useState(0);

    const fiducialSelectedOrMoved = (
        index: number,
        position: FiducialPosition | undefined,
        selectedOrMoved: "selected" | "moved"
    ) => {
        const newFiducials = produce(fiducials, (draft) => {
            draft[index].position = position;
        });
        setFiducials(newFiducials);

        if (selectedOrMoved === "selected") {
            const newIndex = newFiducials.findIndex((fiducial) => !fiducial.position);
            if (newIndex !== -1) {
                setSelectingFiducialIndex(newIndex);
            } else if (selectingFiducialIndex + 1 < fiducials.length) {
                setSelectingFiducialIndex(selectingFiducialIndex + 1);
            }
        }
    };

    const fiducialSelected: FiducialSelected = (index: number, position: FiducialPosition) =>
        fiducialSelectedOrMoved(index, position, "selected");
    const fiducialMoved: FiducialSelected = (index: number, position: FiducialPosition) =>
        fiducialSelectedOrMoved(index, position, "moved");

    const done = fiducials.every((f) => f.position != null);
    return (
        <>
            <ScreenLayout
                content={
                    <FiducialsSelection
                        fiducials={fiducials}
                        onFiducialSelected={fiducialSelected}
                        onFiducialMoved={fiducialMoved}
                        selectingFiducialIndex={selectingFiducialIndex}
                        onLoad={setLoading}
                    ></FiducialsSelection>
                }
                topLeft={
                    <div className="mx-auto bg-white hover:bg-gray-300 rounded-full overflow-hidden cursor-pointer">
                        <ArrowLeftIcon className="h-5 w-5 text-gray-800 m-2 hover:text-gray-600" />
                    </div>
                }
                bottomRight={
                    <Box>
                        <>
                            <div className="block text-lg leading-tight font-medium text-black mb-3">
                                Selecting fiducials
                            </div>
                            <div className="mt-2">
                                {fiducials.map((f, index) => {
                                    const hasPosition = f.position != null;
                                    const selected = selectingFiducialIndex === index;
                                    // const bgColor = selected ? (hasPosition ? 'bg-green-400' : 'bg-gray-400') : (hasPosition ? 'bg-green-200' : 'bg-gray-200')

                                    return (
                                        <div
                                            className={`flex items-center text-md leading-tight text-gray-600 p-2 ${
                                                hasPosition
                                                    ? "ring-green-100	bg-green-200 text-gray-700"
                                                    : "ring-gray-300 bg-gray-200"
                                            } rounded-xl mb-3 ${selected && "ring-4"}`}
                                            onClick={() => setSelectingFiducialIndex(index)}
                                        >
                                            <Ball size={20} color={f.color} />
                                            <span className="ml-2">{f.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-end">
                                <button
                                    className={`${
                                        done
                                            ? "bg-green-400 hover:bg-green-500 text-white font-bold"
                                            : "bg-gray-300 text-gray-500"
                                    } py-2 px-4 rounded-xl mt-2`}
                                    disabled={!done}
                                >
                                    Done
                                </button>
                            </div>
                        </>
                    </Box>
                }
            ></ScreenLayout>
        </>
    );
}

export default FiducialsSelectionScreen;
