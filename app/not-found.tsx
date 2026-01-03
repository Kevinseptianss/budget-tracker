export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontSize: "4rem",
            fontWeight: "bold",
            color: "#333",
            marginBottom: "1rem",
          }}
        >
          404
        </h1>
        <p
          style={{
            fontSize: "1.25rem",
            color: "#666",
          }}
        >
          Page not found
        </p>
      </div>
    </div>
  );
}
