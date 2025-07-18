import React, { useState, useRef } from "react";
import apiClient from "../api/apiClient";
import styles from "./WhatsAppForm.module.scss";
import { useAuth } from "../hooks/UseAuth"; // mantenha se ainda precisar do token

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

  const { token } = useAuth(); // mantenha se o token não for automático

  function insertAroundSelection(tag) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = message.substring(start, end);
    let tagOpen, tagClose;

    if (tag === "bold") tagOpen = tagClose = "*";
    else if (tag === "italic") tagOpen = tagClose = "_";
    else if (tag === "strike") tagOpen = tagClose = "~";
    else tagOpen = tagClose = "";

    const before = message.substring(0, start);
    const after = message.substring(end);
    const newText = before + tagOpen + selected + tagClose + after;
    setMessage(newText);

    setTimeout(() => {
      textarea.setSelectionRange(start + tagOpen.length, end + tagOpen.length);
      textarea.focus();
    }, 0);
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideo(reader.result);
        setVideoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveVideo = () => {
    setVideo(null);
    setVideoPreview(null);
  };

  const handleMediaTypeChange = (type) => {
    setMediaType(type);
    if (type !== "image") {
      setImage(null);
      setImagePreview(null);
    }
    if (type !== "video") {
      setVideo(null);
      setVideoPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Enviando...");

    try {
      const payload = {
        message,
        messageType:
          mediaType === "image"
            ? "image"
            : mediaType === "video"
            ? "video"
            : "noMedia",
      };
      if (mediaType === "image" && image) payload.image = image;
      if (mediaType === "video" && video) payload.video = video;

      // Se apiClient JÁ injeta o token automaticamente, só faça isso:
      await apiClient.post(webhookURL, payload);

      // Se o token NÃO for automático, use assim:
      // await apiClient.post(webhookURL, payload, {
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      // });

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
      <label className={styles.label}>Mensagem:</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button
          type="button"
          className={styles.formatBtn}
          onClick={() => insertAroundSelection("bold")}
        >
          <b>B</b>
        </button>
        <button
          type="button"
          className={styles.formatBtn}
          onClick={() => insertAroundSelection("italic")}
        >
          <i>I</i>
        </button>
        <button
          type="button"
          className={styles.formatBtn}
          onClick={() => insertAroundSelection("strike")}
        >
          <span style={{ textDecoration: "line-through" }}>S</span>
        </button>
        <span style={{ marginLeft: 8, color: "#bbb", fontSize: 12 }}>
          Usa os botões para <b>*negrito*</b>, <i>_itálico_</i> ou <s>~riscado~</s>
        </span>
      </div>
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        className={styles.input}
        placeholder="Digite e use os botões acima para formatar seu texto..."
        required
      />

      <div style={{ marginBottom: 12 }}>
        <span className={styles.label}>Anexar mídia:</span>
        <div style={{ display: "flex", gap: 18, marginTop: 6 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="radio"
              name="media"
              checked={mediaType === "none"}
              onChange={() => handleMediaTypeChange("none")}
            />
            Nenhum
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="radio"
              name="media"
              checked={mediaType === "image"}
              onChange={() => handleMediaTypeChange("image")}
            />
            Imagem
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="radio"
              name="media"
              checked={mediaType === "video"}
              onChange={() => handleMediaTypeChange("video")}
            />
            Vídeo
          </label>
        </div>
      </div>

      {mediaType === "image" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className={styles.input}
          />
          {imagePreview && (
            <div className={styles.imagePreviewWrapper}>
              <img
                src={imagePreview}
                alt="Pré-visualização"
                className={styles.imagePreview}
              />
              <button
                type="button"
                className={styles.removeButton}
                onClick={handleRemoveImage}
                title="Remover imagem"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}

      {mediaType === "video" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className={styles.input}
          />
          {videoPreview && (
            <div className={styles.imagePreviewWrapper}>
              <video
                src={videoPreview}
                className={styles.imagePreview}
                controls
                autoPlay
                loop
              />
              <button
                type="button"
                className={styles.removeButton}
                onClick={handleRemoveVideo}
                title="Remover vídeo"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}

      <button type="submit" className={styles.submitButton}>
        Enviar Mensagem
      </button>
      <p>{status}</p>
    </form>
  );
}
