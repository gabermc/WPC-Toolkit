// ─── CONFIG: atributos tentados em ordem para obter o nome da imagem ────────
const CMS_IMG_NAME_ATTRS    = ["title", "alt", "data-name", "data-title", "aria-label"];
const CMS_IMG_CONTAINER     = "div.widgets-preview-h-full-horizontal img";
// Sufixos gerados automaticamente pelo CMS que devem ser removidos.
const CMS_IMG_NAME_SUFFIXES = [" - image url", " - Image URL", " - image URL", " - IMAGE URL"];

function cleanImgName(val) {
  let result = val.trim();
  for (const suffix of CMS_IMG_NAME_SUFFIXES) {
    if (result.toLowerCase().endsWith(suffix.toLowerCase())) {
      result = result.slice(0, result.length - suffix.length).trim();
      break;
    }
  }
  return result;
}
function getImgName(img) {
  for (const attr of CMS_IMG_NAME_ATTRS) {
    const val = img.getAttribute(attr);
    if (val && val.trim() !== "") return cleanImgName(val);
  }
  return null;
}
function getTargetImages() {
  return Array.from(document.querySelectorAll(CMS_IMG_CONTAINER))
    .filter(img => getImgName(img) !== null);
}
// ─────────────────────────────────────────────────────────────────────────────

function getTargetImages() {
  return Array.from(document.querySelectorAll(CMS_IMG_CONTAINER))
    .filter(img => getImgName(img) !== null);
}
// ─────────────────────────────────────────────────────────────────────────────

const cmsHelpertargetImages = getTargetImages();

cmsHelpertargetImages.forEach((img) => {
  // Reexibe spans já criados
  const spans = document.querySelectorAll('.cms-helper-title');
  spans.forEach((span) => { span.style.display = "block"; });
});
