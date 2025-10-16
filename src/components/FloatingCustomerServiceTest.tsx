"use client";

export default function FloatingCustomerServiceTest() {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 1000,
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        background: "red",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
      }}
    >
      TEST
    </div>
  );
}