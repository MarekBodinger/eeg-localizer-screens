import { FunctionComponent } from "react";

interface ScreenLayoutProps {
    content?: any;
    topLeft?: any;
    bottomLeft?: any;
    bottomRight?: any;
}

const ScreenLayout: FunctionComponent<ScreenLayoutProps> = ({ content, topLeft, bottomLeft, bottomRight }) => {
    return (
        <>
            <div className="h-screen w-screen bg-black">{content}</div>
            <div className="fixed top-5 left-5">{topLeft}</div>
            <div className="fixed bottom-5 left-5">{bottomLeft}</div>
            <div className="fixed bottom-5 right-5">{bottomRight}</div>
        </>
    );
};

export default ScreenLayout;
