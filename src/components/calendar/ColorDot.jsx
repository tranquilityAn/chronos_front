export default function ColorDot({ color }) {
    return (
        <span
            style={{
                display: "inline-block",
                width: 12,
                height: 12,
                borderRadius: 9999,
                backgroundColor: color,
                marginRight: 8,
            }}
        />
    );
}
