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

const addKeepNextToParagraphs = (rowXml) =>
  rowXml.replace(/<w:pPr([\s\S]*?)<\/w:pPr>/g, (match, inner) => {
    if (/w:keepNext\b/i.test(inner)) return match
    return `<w:pPr${inner}<w:keepNext/></w:pPr>`
  })

const ensureCantSplitRow = (rowXml) => {
  if (/<w:cantSplit\b[^>]*\/>/i.test(rowXml)) return rowXml
  return rowXml.replace(
    /<w:trPr([^>]*)>/i,
    (m, attrs) => `<w:trPr${attrs}><w:cantSplit w:val="1"/>`
  )
}

const applyKeepNextForSharedMerges = (xml) => {
  const rowRegex = /<w:tr\b[\s\S]*?<\/w:tr>/gi
  let inMergeGroup = false

  return xml.replace(rowRegex, (row) => {
    const start = containsToken(row, UNIT_MERGE_START_TOKEN)
    const cont = containsToken(row, UNIT_MERGE_CONT_TOKEN)

    if (start || inMergeGroup) {
      row = addKeepNextToParagraphs(row)
      row = ensureCantSplitRow(row)
    }

    if (start) inMergeGroup = true
    if (!cont && !start) inMergeGroup = false

    return row
  })
}

const replaceCurrencyAnchors = (xml) => {
  const currencyAnchorRegex =
    /<w:r\b[^>]*>[^<]*<w:drawing>[\s\S]*?r:embed="rId9"[\s\S]*?<\/w:drawing>[^<]*<\/w:r>/gi
  return xml.replace(currencyAnchorRegex, '<w:r><w:t>{CurrencySymbol}</w:t></w:r>')
}

const removeNothingMoreRows = (xml) => {
  // Leave content intact, but we'll soften borders in a later step.
  return xml
}

const relaxTotalRowHeights = (xml) => {
  const rowRegex = /<w:tr\b[\s\S]*?<\/w:tr>/gi
  const targets = /(TotalPrice|VatPrice|NetPrice|All prices in)/i
  return xml.replace(rowRegex, (row) => {
    if (!targets.test(row)) return row
    return row.replace(/<w:trHeight[^>]*\/>/gi, "")
  })
}

const removeEmptyTrailingRowsInTotalsTable = (xml) => {
  const tableRegex = /<w:tbl\b[\s\S]*?<\/w:tbl>/gi
  return xml.replace(tableRegex, (tbl) => {
    if (!/All prices in/i.test(tbl)) return tbl
    const rows = Array.from(tbl.matchAll(/<w:tr\b[\s\S]*?<\/w:tr>/gi)).map((m) => m[0])
    const rebuilt = []
    let seenAllPrices = false
    for (const row of rows) {
      const text = (row.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [])
        .map((t) => t.replace(/<[^>]+>/g, ""))
        .join("")
        .replace(/\s+/g, "")
      const isEmpty = text === ""
      if (seenAllPrices && isEmpty) {
        continue
      }
      rebuilt.push(row)
      if (/All prices in/i.test(text)) {
        seenAllPrices = true
      }
    }
    return tbl.replace(/<w:tr\b[\s\S]*?<\/w:tr>/gi, () => rebuilt.shift() || "")
  })
}

const softenSpecialRowBorders = (xml) => {
  const rowRegex = /<w:tr\b[\s\S]*?<\/w:tr>/gi
  const cellRegex = /<w:tc\b[\s\S]*?<\/w:tc>/gi
  const stripTopBorder = (cell) =>
    cell.replace(/<w:tcBorders([\s\S]*?)<\/w:tcBorders>/i, (match, inner) => {
      const kept = inner.replace(/<w:top\b[^>]*\/>/gi, "")
      return `<w:tcBorders${kept}</w:tcBorders>`
    })

  const stripBottomBorder = (cell) =>
    cell.replace(/<w:tcBorders([\s\S]*?)<\/w:tcBorders>/i, (match, inner) => {
      const kept = inner.replace(/<w:bottom\b[^>]*\/>/gi, "")
      return `<w:tcBorders${kept}</w:tcBorders>`
    })

  const ensureTcBorders = (cell) => {
    if (/<w:tcBorders[\s\S]*?<\/w:tcBorders>/i.test(cell)) return cell
    return cell.replace(
      /<w:tcPr([\s\S]*?)<\/w:tcPr>/i,
      (match, inner) => `<w:tcPr${inner}<w:tcBorders></w:tcBorders></w:tcPr>`
    )
  }

  return xml.replace(rowRegex, (row) => {
    const text = (row.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/gi) || [])
      .map((t) => t.replace(/<[^>]+>/g, ""))
      .join("")
      .replace(/\s+/g, "")
      .toLowerCase()
    if (text.includes("nothingmore")) {
      return row.replace(cellRegex, (cell) => stripTopBorder(ensureTcBorders(cell)))
    }
    if (text.includes("allpricesin")) {
      return row.replace(cellRegex, (cell) => stripBottomBorder(ensureTcBorders(cell)))
    }
    return row
  })
}

const applyUnitMergeMarkers = (xml) => {
  const cellRegex = /<w:tc\b[\s\S]*?<\/w:tc>/g
  return xml.replace(cellRegex, (cell) => {
    if (containsToken(cell, UNIT_MERGE_START_TOKEN)) {
      let updated = cleanTokens(cell, UNIT_MERGE_START_TOKEN)
      return addMergePr(updated, "start")
    }

    if (containsToken(cell, UNIT_MERGE_CONT_TOKEN)) {
      let updated = cleanTokens(cell, UNIT_MERGE_CONT_TOKEN)
      // ensure cell still has visible text if merge breaks across pages
      if (!/<w:t[^>]*>[^<]*<\/w:t>/i.test(updated)) {
        updated = updated.replace(
          /<w:tc([^>]*)>/,
          (m, attrs) => `<w:tc${attrs}><w:p><w:r><w:t></w:t></w:r></w:p>`
        )
      }
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

    // Keep shared-price blocks together before tokens are removed.
    xml = applyKeepNextForSharedMerges(xml)
    xml = applyUnitMergeMarkers(xml)
    xml = removeNothingMoreRows(xml)
    xml = relaxTotalRowHeights(xml)
    xml = removeEmptyTrailingRowsInTotalsTable(xml)
    xml = softenSpecialRowBorders(xml)
    xml = replaceCurrencyAnchors(xml)

    zip.file(f, xml)
  }

  return zip.generateAsync({ type: "nodebuffer" })
}
