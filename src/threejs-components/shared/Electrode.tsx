import { EventHandlers } from "@react-three/fiber/dist/declarations/src/core/events";
import { forwardRef } from "react";

interface ElectrodeProps {
    position: THREE.Vector3;
    color: THREE.Color;
    radius: number;
    onClick?: EventHandlers["onClick"];
}

const Electrode = forwardRef<THREE.Mesh, ElectrodeProps>(({ position, radius, color, onClick }, ref) => {
    return (
        <mesh position={position} onClick={onClick} ref={ref}>
            <sphereBufferGeometry args={[radius]} />
            <meshStandardMaterial roughness={1} args={[{ color }]} />
        </mesh>
    );
});

export default Electrode;
