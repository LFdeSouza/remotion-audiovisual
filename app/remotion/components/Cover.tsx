import type { CSSProperties } from "react";
import { AbsoluteFill, Img, Html5Audio, interpolate } from "remotion";
import {
  COMPOSITION_FPS,
  COVER_DURATION_IN_SECONDS,
  TRANSITION_DURATION_FRAMES,
} from "../constants.mjs";
import { OrderData } from "../schemata";
import { ClinicLogo } from "./ClinicLogo";

const coverBackgroundStyle: CSSProperties = {
  height: "100%",
  objectFit: "cover",
  width: "100%",
};

const orderInfoStyle: CSSProperties = {
  bottom: 80,
  color: "white",
  position: "absolute",
  display: "flex",
  flexDirection: "column",
  gap: "5px",
  fontSize: 30,
  right: 320,
};

const footerStyle: CSSProperties = {
  bottom: 80,
  color: "white",
  fontSize: 30,
  left: 320,
  position: "absolute",
};

const centeredFooterStyle: CSSProperties = {
  bottom: 80,
  color: "white",
  fontSize: 40,
  left: "50%",
  position: "absolute",
  transform: "translateX(-50%)",
};
const orderDataP: CSSProperties = {
  margin: 0,
  padding: 0,
};

export const Cover = ({
  frame,
  orderData,
}: {
  frame: number;
  orderData: OrderData | null;
}) => {
  const opacity = interpolate(
    frame,
    [
      COVER_DURATION_IN_SECONDS * COMPOSITION_FPS - TRANSITION_DURATION_FRAMES,
      COVER_DURATION_IN_SECONDS * COMPOSITION_FPS,
    ],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const titleAnimation = interpolate(
    frame,
    [3 * COMPOSITION_FPS, 3 * COMPOSITION_FPS + 8],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const messageAnimation = interpolate(
    frame,
    [3 * COMPOSITION_FPS + 5, 3 * COMPOSITION_FPS + 8 * 2],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill style={{ position: "relative", opacity }}>
      <Img
        style={coverBackgroundStyle}
        src="https://revideo-lfs-test.s3.sa-east-1.amazonaws.com/cover/cover.jpg"
      />
      <Html5Audio src="https://revideo-lfs-test.s3.sa-east-1.amazonaws.com/cover/cover_output.mp3" />
      <ClinicLogo
        clinicName={orderData?.clinic}
        accountId={orderData?.accountId}
      />
      <p
        style={{
          color: "white",
          fontSize: 72,
          fontWeight: 700,
          left: "50%",
          opacity: titleAnimation,
          position: "absolute",
          textAlign: "center",
          top: "35%",
          transform: `translateX(-50%) scale(${titleAnimation})`,
          width: "100%",
        }}
      >
        Laudo audiovisual
      </p>
      <div
        style={{
          color: "white",
          position: "fixed",
          top: "25%",
          left: "50%",
          transform: `translateX(-50%) scale(${messageAnimation})`,
          opacity: messageAnimation,
          fontSize: 34,
        }}
      >
        <p>
          Este conteúdo audiovisual possui finalidade exclusivamente
          complementar ao laudo descritivo escrito. Ele apresenta, de forma
          ilustrativa, os principais achados radiológicos, porém não substitui o
          laudo oficial, que permanece como documento único e válido para
          interpretação diagnóstica, tomada de decisão clínica e fins
          médico-legais.
        </p>
        <p style={{ marginTop: "20px" }}>
          A visualização deste material não deve ocorrer de forma isolada,
          tampouco ser utilizado por pessoas não habilitadas. Qualquer dúvida
          diagnóstica ou terapêutica deve ser discutida diretamente com o médico
          solicitante ou com o radiologista reponsável.
        </p>
      </div>

      {orderData && (
        <div style={orderInfoStyle}>
          <p style={orderDataP}>Dr. {orderData.user}</p>
          <p style={orderDataP}>Código: {orderData.code}</p>
          <p style={orderDataP}>Exame: {orderData.portfolio}</p>
        </div>
      )}
      <p style={footerStyle}>Powered by TelerisOn</p>
    </AbsoluteFill>
  );
};

export const BackCover = ({
  frame,
  initialFrame,
}: {
  frame: number;
  initialFrame: number;
}) => {
  const opacity = interpolate(
    frame,
    [
      initialFrame - TRANSITION_DURATION_FRAMES,
      initialFrame + COVER_DURATION_IN_SECONDS,
    ],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill style={{ opacity }}>
      <Img
        style={coverBackgroundStyle}
        src="https://revideo-lfs-test.s3.sa-east-1.amazonaws.com/cover/cover.jpg"
      />
      <Html5Audio src="https://revideo-lfs-test.s3.sa-east-1.amazonaws.com/cover/cover_output.mp3" />
      <AbsoluteFill
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "white", fontSize: 72, fontWeight: 700 }}>
          Agradecemos a confiança
        </p>
      </AbsoluteFill>

      <p style={centeredFooterStyle}>Powered by TelerisOn</p>
    </AbsoluteFill>
  );
};
