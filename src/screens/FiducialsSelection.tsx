import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { Fiducial, FiducialSelected as FiducialSelectedOrMoved } from "./FiducialsSelectionScreen";

interface Props {
    fiducials: Fiducial[];
    onFiducialSelected: FiducialSelectedOrMoved;
    onFiducialMoved: FiducialSelectedOrMoved;
    selectingFiducialIndex: number;
    onLoad: (x: number) => void;
}
let shared: Props = {} as Props;

/*
 * TODOS:
 * - lightining
 * - destroying scene
 * 1-3-2 order and then move
 */

function FiducialsSelection(props: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        (shared as Props).fiducials = props.fiducials;
        (shared as Props).onFiducialSelected = props.onFiducialSelected;
        (shared as Props).onFiducialMoved = props.onFiducialMoved;
        (shared as Props).selectingFiducialIndex = props.selectingFiducialIndex;
        (shared as Props).onLoad = props.onLoad;
    });

    useEffect(() => {
        initializeThreeJs(canvasRef.current as HTMLCanvasElement);
    }, []);

    return (
        <>
            <canvas className="w-full h-full" ref={canvasRef}></canvas>
        </>
    );
}

export default FiducialsSelection;

const initializeThreeJs = (canvasElement: HTMLCanvasElement) => {
    function main() {
        const renderer = new THREE.WebGLRenderer({ canvas: canvasElement });

        const fov = 45;
        const aspect = 2; // the canvas default
        const near = 0.1;
        const far = 10000;
        const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        camera.position.set(0, 0, 15);

        const controls = new OrbitControls(camera, canvasElement);
        controls.minDistance = 4;
        controls.maxDistance = 50;
        controls.target.set(0, 0, 0);
        controls.update();

        const scene = new THREE.Scene();
        scene.background = new THREE.Color("black");

        const intersection = {
            intersects: false,
            point: new THREE.Vector3(),
            normal: new THREE.Vector3(),
        };
        const mouse = new THREE.Vector2();

        let faceMesh: THREE.Mesh;
        let raycaster: THREE.Raycaster;
        let line: THREE.Line;
        let mouseHelper: THREE.Mesh;
        const spheres: {
            index: number;
            mesh: THREE.Mesh;
            intersecting: boolean;
        }[] = [];

        raycaster = new THREE.Raycaster();

        mouseHelper = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 10), new THREE.MeshNormalMaterial());
        mouseHelper.visible = false;
        scene.add(mouseHelper);

        let moved = false;
        let pressed = false;
        let draggingFiducialIndex = -1;

        const geometry = new THREE.BufferGeometry();
        geometry.setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);

        line = new THREE.Line(geometry, new THREE.LineBasicMaterial());
        scene.add(line);

        window.addEventListener("pointerdown", (event) => {
            moved = false;
            pressed = true;

            checkIntersection(event.clientX, event.clientY);
            draggingFiducialIndex = spheres.findIndex((sphere) => sphere.intersecting);

            if (draggingFiducialIndex !== -1) {
                controls.enableRotate = false;
            }
        });

        window.addEventListener("pointerup", (event) => {
            pressed = false;

            if (controls.enableRotate === false) {
                controls.enableRotate = true;
            }

            if (moved === false && draggingFiducialIndex === -1) {
                checkIntersection(event.clientX, event.clientY);
                if (intersection.intersects) {
                    fiducialSelected();
                }
            }

            draggingFiducialIndex = -1;
        });

        window.addEventListener("pointermove", (event) => {
            if (pressed) {
                moved = true;
            }

            if (event.isPrimary) {
                checkIntersection(event.clientX, event.clientY);
                if (draggingFiducialIndex !== -1) {
                    fiducialMoved();
                }
            }
        });

        function checkIntersection(x: number, y: number) {
            if (faceMesh === undefined) return;

            mouse.x = (x / window.innerWidth) * 2 - 1;
            mouse.y = -(y / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(faceMesh, false);

            if (intersects.length > 0) {
                const p = intersects[0].point;
                mouseHelper.position.copy(p);
                intersection.point.copy(p);

                // @ts-ignore
                const n = intersects[0].face.normal.clone();
                n.transformDirection(faceMesh.matrixWorld);
                n.multiplyScalar(10);
                n.add(intersects[0].point);

                // @ts-ignore
                intersection.normal.copy(intersects[0].face.normal);
                mouseHelper.lookAt(n);

                const positions = line.geometry.attributes.position;
                positions.setXYZ(0, p.x, p.y, p.z);
                positions.setXYZ(1, n.x, n.y, n.z);
                positions.needsUpdate = true;

                intersection.intersects = true;

                intersects.length = 0;
            } else {
                intersection.intersects = false;
            }

            spheres.forEach((sphere) => {
                const intersectsSphere = raycaster.intersectObject(sphere.mesh, false);
                if (intersectsSphere.length > 0) {
                    sphere.intersecting = true;
                } else {
                    sphere.intersecting = false;
                }
            });

            document.body.style.cursor = spheres.some((sphere) => sphere.intersecting) ? "move" : "default";
        }

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
        scene.add(ambientLight);
        // TODO skip lighthning?
        // {
        //     const skyColor = 0xb1e1ff; // light blue
        //     const groundColor = 0xb97a20; // brownish orange
        //     const intensity = 1;
        //     const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
        //     scene.add(light);
        // }

        {
            const color = 0xffffff;
            const intensity = 0.5;
            const light = new THREE.DirectionalLight(color, intensity);
            light.position.set(0, 20, 0);
            light.target.position.set(-5, 0, 0);
            scene.add(light);
            scene.add(light.target);
        }

        {
            const color = 0xffffff;
            const intensity = 0.5;
            const light = new THREE.DirectionalLight(color, intensity);
            light.position.set(0, 20, 0);
            light.target.position.set(5, 0, 0);
            scene.add(light);
            scene.add(light.target);
        }

        {
            const a = performance.now();
            new MTLLoader().load(process.env.PUBLIC_URL + "/model_mesh.obj.mtl", (materials) => {
                materials.preload();
                console.log(materials);

                const objLoader = new OBJLoader().setMaterials(materials);
                objLoader.load(
                    process.env.PUBLIC_URL + "/model_mesh.obj",
                    (root) => {
                        root.scale.set(20, 20, 20);
                        faceMesh = root.children[0] as any;
                        console.log(faceMesh);
                        scene.add(root);
                        console.log(performance.now() - a);

                        faceMesh.geometry.getAttribute("uv");
                    },
                    (progress) => shared.onLoad(progress.loaded / progress.total)
                );
            });
        }

        function resizeRendererToDisplaySize(renderer: THREE.WebGLRenderer) {
            const canvas = renderer.domElement;
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            const needResize = canvas.width !== width || canvas.height !== height;
            if (needResize) {
                renderer.setSize(width, height, false);
            }
            return needResize;
        }

        function render() {
            if (resizeRendererToDisplaySize(renderer)) {
                const canvas = renderer.domElement;
                camera.aspect = canvas.clientWidth / canvas.clientHeight;
                camera.updateProjectionMatrix();
            }

            renderer.render(scene, camera);

            requestAnimationFrame(render);
        }

        function fiducialSelected() {
            const position = new THREE.Vector3();
            const orientation = new THREE.Euler();

            position.copy(intersection.point);
            //@ts-ignore
            window.xyz = window.xyz
                ? //@ts-ignore
                  [...window.xyz, [position.x, position.y, position.z]]
                : [position.x, position.y, position.z];
            orientation.copy(mouseHelper.rotation);

            let sphere = spheres.find((sphere) => sphere.index === shared.selectingFiducialIndex);
            if (!sphere) {
                const sphereGeometry = new THREE.SphereGeometry(0.07, 32, 32);
                const sphereMaterial = new THREE.MeshStandardMaterial({
                    color: (shared.fiducials as Fiducial[])[shared.selectingFiducialIndex as number].color,
                    roughness: 0.8,
                    metalness: 0.5,
                });
                const newSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
                newSphere.position.set(position.x, position.y, position.z);

                scene.add(newSphere);
                spheres.push({
                    index: shared.selectingFiducialIndex as number,
                    mesh: newSphere,
                    intersecting: false,
                });
            } else {
                sphere.mesh.position.set(position.x, position.y, position.z);
            }

            shared.onFiducialSelected && shared.onFiducialSelected(shared.selectingFiducialIndex as number, position);
        }

        function fiducialMoved() {
            const position = new THREE.Vector3();
            const orientation = new THREE.Euler();

            position.copy(intersection.point);
            orientation.copy(mouseHelper.rotation);

            if (draggingFiducialIndex === -1) {
                return;
            }
            const draggingSphere = spheres.find((s) => s.index === draggingFiducialIndex);
            draggingSphere?.mesh.position.set(position.x, position.y, position.z);
            shared.onFiducialMoved && shared.onFiducialMoved(draggingFiducialIndex, position);
        }

        requestAnimationFrame(render);
    }

    main();
};
