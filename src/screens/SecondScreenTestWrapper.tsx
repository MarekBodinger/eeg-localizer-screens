import { FunctionComponent, useRef } from "react";
import { mock2DElectrodes } from "../mock-data/2d-electrodes";
import { useElementSize } from "./second-screen/useElementSize";
import { useImageSize } from "./second-screen/useImageSize";
import SecondScreen from "./SecondScreen";

const SecondScreenTestWrapper: FunctionComponent = () => {
    const imageUrl = process.env.PUBLIC_URL + "/model_texture.jpg";
    const imageSize = useImageSize(imageUrl);
    const ref = useRef<HTMLDivElement>(null);
    const parentSize = useElementSize(ref);

    return (
        <div ref={ref} className="w-screen h-screen">
            {imageUrl && imageSize && parentSize && (
                <SecondScreen
                    parentWidth={parentSize.width}
                    parentHeight={parentSize.height}
                    imageWidth={imageSize.width}
                    imageHeight={imageSize.height}
                    url={imageUrl}
                    electrodes={mock2DElectrodes}
                ></SecondScreen>
            )}
        </div>
    );
};

export default SecondScreenTestWrapper;
