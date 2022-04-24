import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { FunctionComponent, useEffect, useLayoutEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import Electrode from "./shared/Electrode";
import { fitCameraToCenteredObject } from "./shared/helpers/fit";

const bgColor = new THREE.Color("black");

export interface Head3DElectrode {
    position: THREE.Vector3;
    color: THREE.Color;
}

interface Head3DProps {
    electrodes: Head3DElectrode[];
    onElectrodeClick?(electrode: Head3DElectrode): void;
}

function Lights() {
    const light = useMemo(() => new THREE.DirectionalLight(0xffffff, 0.5), []);
    return (
        <>
            <ambientLight color={0xffffff} intensity={0.25} />
            <primitive object={light} position={[0, 1, 0]} />
            <primitive object={light.target} position={[-1 / 4, 0, 0]} />
            <primitive object={light} position={[0, 1, 0]} />
            <primitive object={light.target} position={[1 / 4, 0, 0]} />
        </>
    );
}

const Head3DInner: FunctionComponent<Head3DProps> = ({ electrodes, onElectrodeClick }) => {
    // TODO fix loading
    // const materials = useLoader(MTLLoader, process.env.PUBLIC_URL + "/model_mesh.obj.mtl");
    // const object = useLoader(OBJLoader, process.env.PUBLIC_URL + "/model_mesh.obj", (loader) => {
    //     materials.preload();
    //     // @ts-ignore
    //     loader.setMaterials(materials);
    // });

    const [faceMesh, setFaceMesh] = useState<THREE.Mesh>();
    const ballSize = useMemo(() => {
        if (!faceMesh) {
            return;
        }
        const boundingBox = new THREE.Box3().setFromObject(faceMesh);
        const size = boundingBox.getSize(new THREE.Vector3());
        console.log(boundingBox, size);
        return Math.max(size.x, size.y, size.z) / 100;
    }, [faceMesh]);

    useEffect(() => {
        new MTLLoader().load(process.env.PUBLIC_URL + "/model_mesh.obj.mtl", (materials) => {
            materials.preload();
            console.log(materials);

            const objLoader = new OBJLoader().setMaterials(materials);
            objLoader.load(process.env.PUBLIC_URL + "/model_mesh.obj", (root) => {
                root.scale.set(20, 20, 20);

                const faceMesh = root.children[0];
                setFaceMesh(faceMesh as THREE.Mesh);
            });
        });
    }, []);

    const { camera } = useThree();

    useLayoutEffect(() => {
        if (!faceMesh) {
            return;
        }
        fitCameraToCenteredObject(camera, faceMesh);
    }, [faceMesh]);

    return (
        <>
            {faceMesh ? (
                <>
                    <primitive object={faceMesh}></primitive>
                    {electrodes.map((electrode) => (
                        <Electrode
                            position={electrode.position}
                            radius={ballSize as number}
                            color={electrode.color}
                            onClick={() => (onElectrodeClick ? onElectrodeClick(electrode) : undefined)}
                        ></Electrode>
                    ))}
                </>
            ) : null}
        </>
    );
};

const Head3D: FunctionComponent<Head3DProps> = (props) => {
    return (
        <Canvas>
            <color attach="background" args={[bgColor]} />
            <PerspectiveCamera makeDefault position={[2, 0, 0]}>
                <Lights></Lights>
            </PerspectiveCamera>
            <Head3DInner {...props}></Head3DInner>
            <OrbitControls />
        </Canvas>
    );
};

export default Head3D;
