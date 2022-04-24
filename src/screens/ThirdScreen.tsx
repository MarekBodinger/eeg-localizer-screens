import { ArrowLeftIcon } from "@heroicons/react/solid";
import { WritableDraft } from "immer/dist/internal";
import { FunctionComponent, useMemo } from "react";
import Select, { SingleValue } from "react-select";
import * as THREE from "three";
import { useImmer } from "use-immer";
import Ball from "../components/Ball";
import Box from "../components/Box";
import ScreenLayout from "../components/ScreenLayout";
import Head3D, { Head3DElectrode } from "../threejs-components/Head3D";
import Sphere3D, { Sphere3DElectrode } from "../threejs-components/Sphere3D";

interface ElectrodeSphere {
    position: [number, number, number];
    label: string;
}

interface ElectrodeHead {
    position: [number, number, number];
}

interface ThirdsScreenProps {
    electrodesSphere: ElectrodeSphere[];
    electrodesHead: ElectrodeHead[];
}

interface Connection {
    sphereLabel: string | null;
    headIndex: number | null;
}

const requiredConnections = 3;
const newConnection: Connection = {
    sphereLabel: null,
    headIndex: null,
};

const colors = ["#ff00ff", "red", "#66dd99"];
const threeColors = colors.map((color) => new THREE.Color(color));

const ThirdScreen: FunctionComponent<ThirdsScreenProps> = ({ electrodesSphere, electrodesHead }) => {
    const [connections, setConnections] = useImmer<Connection[]>([]);
    const [editingConnection, setEditingConnection] = useImmer<Connection | null>(newConnection);

    const getConnectingColorIndex = () => connections.length;

    const done = connections.length === requiredConnections;

    const electrodesSphereMapped = useMemo(
        () =>
            electrodesSphere.map((x) => {
                const isInConnectedIndex = connections.findIndex((c) => c.sphereLabel === x.label);
                const isInEditing = editingConnection?.sphereLabel === x.label;
                return {
                    ...x,
                    position: new THREE.Vector3(...x.position),
                    color:
                        isInConnectedIndex !== -1
                            ? threeColors[isInConnectedIndex]
                            : isInEditing
                            ? threeColors[getConnectingColorIndex()]
                            : new THREE.Color("white"),
                };
            }),
        [electrodesSphere, connections, editingConnection]
    );
    const electrodesHeadMapped = useMemo(
        () =>
            electrodesHead.map((x, index) => {
                const isInConnectedIndex = connections.findIndex((c) => c.headIndex === index);
                const isInEditing = editingConnection?.headIndex === index;
                return {
                    ...x,
                    position: new THREE.Vector3(...x.position),
                    color:
                        isInConnectedIndex !== -1
                            ? threeColors[isInConnectedIndex]
                            : isInEditing
                            ? threeColors[getConnectingColorIndex()]
                            : new THREE.Color("white"),
                };
            }),
        [electrodesSphere, connections, editingConnection]
    );

    const selectOptionsHead = useMemo(
        () => electrodesHead.map((e, i) => ({ value: i, label: String(i + 1) })),
        [electrodesHead]
    );
    const selectOptionsSphere = useMemo(
        () => electrodesSphere.map((e) => ({ value: e.label, label: e.label })),
        [electrodesHead]
    );

    const handleSphereElectrodeClicked = (electrode: Sphere3DElectrode) => {
        if (!editingConnection) {
            return;
        }
        if (connections.some((connection) => connection.sphereLabel === electrode.label)) {
            return;
        }
        setEditingConnection((draft) => {
            (draft as WritableDraft<Connection>).sphereLabel = electrode.label;
        });
    };

    const handleHeadElectrodeClicked = (electrode: Head3DElectrode) => {
        if (!editingConnection) {
            return;
        }
        const index = electrodesHeadMapped.indexOf(electrode);
        if (connections.some((connection) => connection.headIndex === index)) {
            return;
        }
        setEditingConnection((draft) => {
            (draft as WritableDraft<Connection>).headIndex = index;
        });
    };

    const handleHeadIndexChange = (value: SingleValue<{ value: number; label: string }>) => {
        if (!editingConnection) {
            return;
        }
        setEditingConnection((draft) => {
            (draft as WritableDraft<Connection>).headIndex = value?.value ?? null;
        });
    };

    const handleSphereLabelChange = (value: SingleValue<{ value: string; label: string }>) => {
        if (!editingConnection) {
            return;
        }
        setEditingConnection((draft) => {
            (draft as WritableDraft<Connection>).sphereLabel = value?.value ?? null;
        });
    };

    const handleConfirmEditingClick = () => {
        if (!editingConnection) {
            return;
        }
        setConnections((draft) => {
            draft.push(editingConnection);
        });
        setEditingConnection(() => (connections.length < requiredConnections - 1 ? newConnection : null));
    };

    const hadleRemoveConnectionClick = (index: number) => {
        setConnections((draft) => {
            draft.splice(index, 1);
        });
        if (connections.length === requiredConnections) {
            setEditingConnection(() => newConnection);
        }
    };

    return (
        <ScreenLayout
            content={
                <>
                    <div className="flex w-full h-full">
                        <div className="w-1/2">
                            <Sphere3D
                                electrodes={electrodesSphereMapped}
                                onElectrodeClick={handleSphereElectrodeClicked}
                            />
                        </div>
                        <div className="w-1/2">
                            <Head3D electrodes={electrodesHeadMapped} onElectrodeClick={handleHeadElectrodeClicked} />
                        </div>
                    </div>
                </>
            }
            topLeft={
                <div className="mx-auto bg-white hover:bg-gray-300 rounded-full overflow-hidden cursor-pointer">
                    <ArrowLeftIcon className="h-5 w-5 text-gray-800 m-2 hover:text-gray-600" />
                </div>
            }
            bottomRight={
                <Box>
                    <div className="block text-lg leading-tight font-medium text-black mb-3">Electrodes matching</div>
                    {connections.map((connection, index) => (
                        <div
                            className={`flex items-center text-md leading-tight text-gray-600 p-2 ${
                                true ? "ring-green-100	bg-green-200 text-gray-700" : "ring-gray-300 bg-gray-200"
                            } rounded-xl mb-3 ${false && "ring-4"}`}
                            key={`electrode-${index}`}
                        >
                            <Ball size={20} color={colors[index]}></Ball>
                            <Select
                                className="ml-2"
                                value={selectOptionsSphere.find((o) => o.value === connection?.sphereLabel)}
                                options={selectOptionsSphere}
                                menuPlacement={"auto"}
                                isDisabled={true}
                            ></Select>
                            <Select
                                value={selectOptionsHead.find((o) => o.value === connection?.headIndex)}
                                options={selectOptionsHead}
                                menuPlacement={"auto"}
                                isDisabled={true}
                            ></Select>
                            <button className="ml-2" onClick={() => hadleRemoveConnectionClick(index)}>
                                Remove
                            </button>
                        </div>
                    ))}
                    {!done && (
                        <div
                            className={`flex items-center text-md leading-tight text-gray-600 p-2 ${
                                false ? "ring-green-100	bg-green-200 text-gray-700" : "ring-gray-300 bg-gray-200"
                            } rounded-xl mb-3 ${true && "ring-4"}`}
                            key={`electrode-${connections.length}`}
                        >
                            <Ball size={20} color={colors[getConnectingColorIndex()]}></Ball>
                            <Select
                                className="ml-2"
                                value={selectOptionsSphere.find((o) => o.value === editingConnection?.sphereLabel)}
                                onChange={handleSphereLabelChange}
                                options={selectOptionsSphere}
                                menuPlacement={"auto"}
                            ></Select>
                            <Select
                                value={selectOptionsHead.find((o) => o.value === editingConnection?.headIndex)}
                                onChange={handleHeadIndexChange}
                                options={selectOptionsHead}
                                menuPlacement={"auto"}
                            ></Select>
                            <button
                                className="ml-2"
                                onClick={handleConfirmEditingClick}
                                disabled={
                                    editingConnection?.headIndex == null || editingConnection?.sphereLabel == null
                                }
                            >
                                Join
                            </button>
                        </div>
                    )}
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
                </Box>
            }
        ></ScreenLayout>
    );
};

export default ThirdScreen;
