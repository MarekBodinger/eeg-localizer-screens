import styled from "styled-components";

interface BallProps {
    size: number;
    color: string;
}

const Ball = styled.div<BallProps>`
    display: inline-block;
    border-radius: 100%;
    height: ${(props) => props.size}px;
    width: ${(props) => props.size}px;
    background: radial-gradient(
        circle at ${(props) => (props.size * 7) / 20}px ${(props) => (props.size * 7) / 20}px,
        ${(props) => props.color},
        black
    );
`;

export default Ball;
