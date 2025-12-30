import JSZip from "jszip"
import {
  UNIT_MERGE_CONT_TOKEN,
  UNIT_MERGE_START_TOKEN,
} from "@/app/lib/sharedPriceTokens"

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const START_MARKER = escapeRegExp(UNIT_MERGE_START_TOKEN)
const CONT_MARKER = escapeRegExp(UNIT_MERGE_CONT_TOKEN)

const addMergePr = (cell, type) => {
  const mergeVal = type === "start" ? "restart" : "continue"
  let updated = cell.replace(/<w:vMerge[^>]*\/>/g, "")

  const ensureVAlignCenter = (tcPrInner) => {
    if (/<w:vAlign\b[^>]*>/i.test(tcPrInner)) {
      return tcPrInner.replace(/<w:vAlign\b[^>]*?\/>/gi, '<w:vAlign w:val="center"/>')
    }
    return `${tcPrInner}<w:vAlign w:val="center"/>`
  }

  if (/<w:tcPr[\s\S]*?<\/w:tcPr>/.test(updated)) {
    updated = updated.replace(
      /<w:tcPr([\s\S]*?)<\/w:tcPr>/,
      (match, inner) =>
        `<w:tcPr${ensureVAlignCenter(inner)}<w:vMerge w:val="${mergeVal}"/></w:tcPr>`
    )
  } else {
    updated = updated.replace(
      /<w:tc([^>]*)>/,
      `<w:tc$1><w:tcPr><w:vAlign w:val="center"/><w:vMerge w:val="${mergeVal}"/></w:tcPr>`
    )
  }

  return updated
}

const toEntity = (value) => value.replace(/</g, "&lt;").replace(/>/g, "&gt;")

const tokenVariants = (token) => [token, toEntity(token)]

const cleanTokens = (markup, token) => {
  const variants = tokenVariants(token)
  return markup.replace(/(<w:t[^>]*>)([\s\S]*?)(<\/w:t>)/g, (match, open, text, close) => {
    let cleaned = text
    variants.forEach((variant) => {
      if (variant && cleaned.includes(variant)) {
        cleaned = cleaned.split(variant).join("")
      }
    })
    return `${open}${cleaned}${close}`
  })
}

const containsToken = (markup, token) =>
  tokenVariants(token).some((variant) => variant && markup.includes(variant))

const applyUnitMergeMarkers = (xml) => {
  const cellRegex = /<w:tc\b[\s\S]*?<\/w:tc>/g
  return xml.replace(cellRegex, (cell) => {
    if (containsToken(cell, UNIT_MERGE_START_TOKEN)) {
      let updated = cleanTokens(cell, UNIT_MERGE_START_TOKEN)
      return addMergePr(updated, "start")
    }

    if (containsToken(cell, UNIT_MERGE_CONT_TOKEN)) {
      let updated = cleanTokens(cell, UNIT_MERGE_CONT_TOKEN)
      // ensure empty run so docx shows blank cell
      updated = updated.replace(/<w:t([^>]*)><\/w:t>/g, `<w:t$1></w:t>`)
      return addMergePr(updated, "cont")
    }

    return cell
  })
}

export async function normalizeDocx(buffer) {
  const zip = await JSZip.loadAsync(buffer)
  const files = Object.keys(zip.files).filter((f) =>
    f.match(/^word\/(document|header\d*|footer\d*)\.xml$/)
  )

  for (const f of files) {
    let xml = await zip.file(f).async("string")

    xml = xml
      .replace(/<w:cantSplit[^>]*>/g, '<w:cantSplit w:val="0"/>')
      .replace(/<w:trHeight[^>]*>/g, '<w:trHeight w:hRule="auto"/>')
      .replace(/<w:tblpPr[^>]*>[\s\S]*?<\/w:tblpPr>/g, "")
      .replace(
        /<w:tblLook [^>]*\/>/g,
        '<w:tblLook w:noHBand="0" w:noVBand="0"/>'
      )
      .replace(/<\/w:tblPr>/g, '<w:tblOverlap w:val="never"/><\/w:tblPr>')

    xml = xml.replace(
      /(<w:p[^>]*>[\s\S]*?<w:keepNext\/>[\s\S]*?<\/w:p>)(\s*<w:tbl)/g,
      (match, para, tbl) => para.replace(/<w:keepNext\/>/g, "") + tbl
    )

    xml = xml.replace(/<w:p>\s*<\/w:p>/g, "")

    xml = xml.replace(
      /<w:pPr>[\s\S]*?(<w:keepNext\/>|<w:pageBreakBefore\/>)[\s\S]*?<\/w:pPr>(\s*<w:tbl)/g,
      (match, pPr, tbl) =>
        pPr
          .replace(/<w:keepNext\/>/g, "")
          .replace(/<w:pageBreakBefore\/>/g, "") + tbl
    )

    xml = xml.replace(/<w:cantSplit w:val="1"\/>/g, '<w:cantSplit w:val="0"/>')

    xml = applyUnitMergeMarkers(xml)

    zip.file(f, xml)
  }

  return zip.generateAsync({ type: "nodebuffer" })
}
