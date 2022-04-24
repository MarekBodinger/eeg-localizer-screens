import { FunctionComponent } from "react";

interface BoxProps {}

const Box: FunctionComponent<BoxProps> = ({ children }) => {
    return <div className="mx-auto bg-white rounded-xl shadow-md w-96 p-6">{children}</div>;
};

export default Box;
