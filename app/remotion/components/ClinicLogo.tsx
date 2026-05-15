import type { CSSProperties } from "react";
import { Img } from "remotion";

const clinicsMap: Record<string, { filename: string; size: number[] }> = {
  CRPII: { filename: "CRPII.png", size: [290, 170] },
  "DATAX - BARRA DOWNTOWN": { filename: "datax.png", size: [400, 170] },
  "DATAX - BARRA NOVO LEBLON": { filename: "datax.png", size: [400, 170] },
  "DATAX - CENTRO": { filename: "datax.png", size: [400, 170] },
  "DATAX - IPANEMA": { filename: "datax.png", size: [400, 170] },
  "DATAX - TIJUCA": { filename: "datax.png", size: [400, 170] },
  INTTELIGENCE: { filename: "intteligence.png", size: [420, 170] },
  IRSA: { filename: "irsa.png", size: [250, 120] },
  MAIS9: { filename: "maisnove.png", size: [350, 140] },
  MEDLAGOS: { filename: "MEDSCANLAGOS.png", size: [250, 180] },
  "PROTON DIAGNOSTICOS": { filename: "proton.jpg", size: [350, 150] },
  RADMED: { filename: "RADMED.jpeg", size: [200, 180] },
  "SILVESTRE SANTE": { filename: "silvestresante.webp", size: [350, 120] },
  TOMOIMAGEM: { filename: "tomoimagem.png", size: [450, 100] },
  "UNIMED-VR": { filename: "unimed_vr.webp", size: [350, 135] },
};

const containerStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  justifyContent: "center",
  position: "fixed",
  top: "6%",
  width: "100%",
  margin: "auto,0",
  gap: "200px",
};

const logoContainerStyle: CSSProperties = {
  backgroundColor: "rgba(243, 244, 246, 0.9)",
  borderRadius: "20px",
  padding: "12px",
  width: "300px",
  height: "130px",
};

const imgStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
};

export function ClinicLogo({
  clinicName,
  accountId,
}: {
  clinicName?: string;
  accountId?: string;
}) {
  const clinicLogo = clinicName && clinicsMap[clinicName];

  if (!accountId || accountId != "2") {
    return null;
  }

  if (!clinicLogo) {
    return (
      <div style={containerStyle}>
        <div style={logoContainerStyle}>
          <Img
            style={imgStyle}
            src="https://revideo-telerison.s3.sa-east-1.amazonaws.com/cover/bmk-logo-transparent.png"
          />
        </div>
      </div>
    );
  }

  const { filename } = clinicsMap[clinicName];
  const src = `https://revideo-telerison.s3.sa-east-1.amazonaws.com/cover/${filename}`;
  return (
    <div style={containerStyle}>
      <div style={logoContainerStyle}>
        <Img
          style={imgStyle}
          src="https://revideo-telerison.s3.sa-east-1.amazonaws.com/cover/bmk-logo-transparent.png"
        />
      </div>

      <div style={logoContainerStyle}>
        <Img style={imgStyle} src={src} />
      </div>
    </div>
  );
}
