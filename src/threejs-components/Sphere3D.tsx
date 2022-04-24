import { OrbitControls, PerspectiveCamera, Text } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { forwardRef, FunctionComponent, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Vector3 } from "three";
import Electrode from "./shared/Electrode";
import { fitCameraToCenteredObject } from "./shared/helpers/fit";

const sphereColor = new THREE.Color(0x404057);
const bgColor = new THREE.Color("black");
const spherePosition = new Vector3(0, 0, 0);

interface WordProps {
    position: THREE.Vector3;
}

const Word: FunctionComponent<WordProps> = ({ children, position }) => {
    const fontProps = {
        fontSize: 0.05,
        letterSpacing: -0.05,
        lineHeight: 1,
        "material-toneMapped": false,
    };
    const ref = useRef<THREE.Mesh>();

    useFrame(({ camera }) => {
        ref.current?.quaternion.copy(camera.quaternion);
    });

    return (
        <Text
            ref={ref}
            position={position}
            {...fontProps}
            children={children}
            anchorY={0.03}
            material-depthTest={false}
        />
    );
};

const Sphere = forwardRef<THREE.Mesh, { position: THREE.Vector3 }>(({ position }, ref) => {
    const { camera } = useThree();

    useLayoutEffect(() => {
        if (!(ref as any)?.current) {
            return;
        }
        fitCameraToCenteredObject(camera, (ref as any).current);
    }, [camera]);

    return (
        <mesh position={position} ref={ref} name="sphereMesh">
            <sphereBufferGeometry />
            <meshStandardMaterial roughness={1} emissive={sphereColor} />
        </mesh>
    );
});

interface ElectrodeWithLabelProps {
    electrode: Sphere3DElectrode;
    sphereRef: any;
    onClick?(electrode: Sphere3DElectrode): void;
}

const ElectrodeWithLabel: FunctionComponent<ElectrodeWithLabelProps> = ({ electrode, onClick }) => {
    const [showWord, setShowWord] = useState(false);
    const electrodeSphereRef = useRef<THREE.Mesh>();

    useFrame(({ camera, raycaster, scene }) => {
        const sphere = scene.getObjectByName("sphereMesh") as THREE.Object3D;
        var startPoint = camera.position.clone();
        var directionVector = electrodeSphereRef.current?.position.clone().sub(startPoint);

        // TODO optimize this
        raycaster.set(startPoint, (directionVector as any).clone().normalize());

        const n = raycaster.intersectObjects([electrodeSphereRef.current as any, sphere]);
        const textIntersection = n.find((intersection) => intersection.object === electrodeSphereRef.current);
        const sphereIntersection = n.find((intersection) => intersection.object === sphere);
        if (!textIntersection || !sphereIntersection) {
            return;
        }
        if (sphereIntersection.distance < textIntersection.distance) {
            setShowWord(false);
        } else {
            setShowWord(true);
        }
    });
    return (
        <>
            {showWord && <Word position={electrode.position} children={electrode.label} />}
            <Electrode
                position={electrode.position}
                radius={0.02}
                color={electrode.color}
                ref={electrodeSphereRef as any}
                onClick={() => (onClick ? onClick(electrode) : undefined)}
            ></Electrode>
        </>
    );
};

const Content: FunctionComponent<Sphere3DProps> = ({ electrodes, onElectrodeClick: onClick }) => {
    const sphereRef = useRef<THREE.Mesh>();

    return (
        <group>
            <Sphere position={spherePosition} ref={sphereRef as any} />
            {electrodes.map((electrode, index) => (
                <ElectrodeWithLabel electrode={electrode} sphereRef={sphereRef} key={index} onClick={onClick} />
            ))}
        </group>
    );
};

export interface Sphere3DElectrode {
    position: THREE.Vector3;
    label: string;
    color: THREE.Color;
}

interface Sphere3DProps {
    electrodes: Sphere3DElectrode[];
    onElectrodeClick?(electrode: Sphere3DElectrode): void;
}

const Sphere3D: FunctionComponent<Sphere3DProps> = (props) => {
    return (
        <Canvas>
            <color attach="background" args={[bgColor]} />
            <PerspectiveCamera makeDefault position={[2, 0, 0]}>
                <pointLight position={[10, 10, -10]} color="orange" />
                <pointLight position={[-10, -10, 10]} color="lightblue" />
            </PerspectiveCamera>

            <OrbitControls />
            <axesHelper args={[10]} />

            <Content {...props} />
        </Canvas>
    );
};

export default Sphere3D;
