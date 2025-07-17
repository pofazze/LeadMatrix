import React from "react";
import WhatsAppForm from "../components/WhatsAppForm";
import Navbar from "../components/Navbar";

export default function Disparo() {
  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <h2>Disparo de Mensagens</h2>
        <WhatsAppForm />
      </div>
    </>
  );
}
