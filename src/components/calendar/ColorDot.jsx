export default function ColorDot({ color }) {
    return (
        <div
            style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: color || "#000",
            }}
        />
    );
}
