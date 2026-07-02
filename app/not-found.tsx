export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-geist-sans), sans-serif",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontSize: "5rem",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#1c1c1e",
            marginBottom: "0.5rem",
          }}
        >
          404
        </h1>
        <p
          style={{
            fontSize: "1.1rem",
            color: "#8e8e93",
          }}
        >
          Page not found
        </p>
      </div>
    </div>
  );
}
