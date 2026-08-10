export function renderCard(data: { title: string; lines: [string, string][]; footer: string }): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 1080; c.height = 1080;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fff"; g.fillRect(0, 0, 1080, 1080);
  g.fillStyle = "#111"; g.font = "bold 56px sans-serif";
  g.fillText(data.title, 80, 140);
  g.font = "40px sans-serif"; let y = 300;
  for (const [k, v] of data.lines) {
    g.fillStyle = "#666"; g.fillText(k, 80, y);
    g.fillStyle = "#111"; g.textAlign = "right"; g.fillText(v, 1000, y);
    g.textAlign = "left"; y += 90;
  }
  g.fillStyle = "#0b5cad"; g.font = "32px sans-serif";
  g.fillText(data.footer, 80, 1000);
  return c;
}
export function downloadCard(canvas: HTMLCanvasElement, filename: string) {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png"); a.download = filename; a.click();
}
export async function shareCard(canvas: HTMLCanvasElement, text: string) {
  const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));
  const file = new File([blob], "result.png", { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], text });
  } else {
    downloadCard(canvas, "result.png");
  }
}
