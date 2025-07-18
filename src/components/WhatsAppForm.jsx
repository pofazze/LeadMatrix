import React, { useState, useRef } from "react";
import apiClient from "../api/apiClient"; // Importação atualizada
import styles from "./WhatsAppForm.module.scss";

export default function WhatsAppForm() {
  const webhookURL = "/webhook/disparom15";

  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [mediaType, setMediaType] = useState("none");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const textareaRef = useRef(null);

  // useAuth não é mais necessário para pegar o token

  function insertAroundSelection(tag) {
    // ... (função sem alteração)
  }

  const handleImageChange = (e) => {
    // ... (função sem alteração)
  };

  const handleRemoveImage = () => { /* ... */ };
  const handleVideoChange = (e) => { /* ... */ };
  const handleRemoveVideo = () => { /* ... */ };
  const handleMediaTypeChange = (type) => { /* ... */ };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Enviando...");

    try {
      const payload = {
        message,
        messageType: mediaType,
      };
      if (mediaType === "image" && image) payload.image = image;
      if (mediaType === "video" && video) payload.video = video;

      // Chamada atualizada para apiClient. Não precisa mais dos headers.
      await apiClient.post(webhookURL, payload);

      setStatus("✅ Mensagens enviadas com sucesso!");
      setMessage("");
      setMediaType("none");
      setImage(null);
      setImagePreview(null);
      setVideo(null);
      setVideoPreview(null);
    } catch (err) {
      if (err.response) {
        setStatus("❌ Erro ao enviar.");
      } else {
        setStatus("❌ Erro de conexão.");
      }
      console.error(err);
    }
  };

  return (
    <form className={styles.formBox} onSubmit={handleSubmit}>
        {/* ... (Todo o seu JSX continua o mesmo) ... */}
    </form>
  );
}