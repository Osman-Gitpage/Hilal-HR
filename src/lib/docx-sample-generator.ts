import JSZip from "jszip";

export interface EvrakData {
  evrakNo: string;
  tarih: string;
  konu: string;
  alici: string;
  gonderen: string;
  icerik: string;
  unvan?: string;
}

export async function generateSampleDocx(data: EvrakData): Promise<Blob> {
  const zip = new JSZip();

  // 1. [Content_Types].xml
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  // 2. _rels/.rels
  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  // Escaping XML text
  const escapeXml = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const evrakNoEsc = escapeXml(data.evrakNo);
  const tarihEsc = escapeXml(data.tarih);
  const konuEsc = escapeXml(data.konu);
  const aliciEsc = escapeXml(data.alici);
  const gonderenEsc = escapeXml(data.gonderen);
  const unvanEsc = escapeXml(data.unvan || "Şirket Yetkilisi");

  // Paragraph lines from icerik
  const paragraphs = data.icerik
    .split("\n")
    .map(
      (line) => `
    <w:p>
      <w:pPr>
        <w:spacing w:line="360" w:lineRule="auto" w:after="200"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI"/>
          <w:sz w:val="23"/>
        </w:rPr>
        <w:t>${escapeXml(line)}</w:t>
      </w:r>
    </w:p>`
    )
    .join("");

  // 3. word/document.xml
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <!-- Header Badge / Top Info -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:bottom w:val="single" w:sz="12" w:space="0" w:color="2563EB"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        <w:tc>
          <w:p>
            <w:pPr><w:jc w:val="left"/></w:pPr>
            <w:r>
              <w:rPr><w:b/><w:color w:val="2563EB"/><w:sz w:val="28"/><w:rFonts w:ascii="Segoe UI"/></w:rPr>
              <w:t>EVRAK SİSTEMİ RESMİ BELGESİ</w:t>
            </w:r>
          </w:p>
        </w:tc>
        <w:tc>
          <w:p>
            <w:pPr><w:jc w:val="right"/></w:pPr>
            <w:r>
              <w:rPr><w:color w:val="64748B"/><w:sz w:val="20"/><w:rFonts w:ascii="Segoe UI"/></w:rPr>
              <w:t>Evrak No: ${evrakNoEsc}</w:t>
            </w:r>
          </w:p>
          <w:p>
            <w:pPr><w:jc w:val="right"/></w:pPr>
            <w:r>
              <w:rPr><w:color w:val="64748B"/><w:sz w:val="20"/><w:rFonts w:ascii="Segoe UI"/></w:rPr>
              <w:t>Tarih: ${tarihEsc}</w:t>
            </w:r>
          </w:p>
        </w:tc>
      </w:tr>
    </w:tbl>

    <w:p><w:pPr><w:spacing w:after="400"/></w:pPr></w:p>

    <!-- ALICI MAKAM -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="300"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="26"/><w:rFonts w:ascii="Segoe UI"/></w:rPr>
        <w:t>${aliciEsc}</w:t>
      </w:r>
    </w:p>

    <!-- KONU -->
    <w:p>
      <w:pPr>
        <w:spacing w:after="360"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:b/><w:color w:val="1E293B"/><w:sz w:val="22"/><w:rFonts w:ascii="Segoe UI"/></w:rPr>
        <w:t>KONU: </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="22"/><w:rFonts w:ascii="Segoe UI"/></w:rPr>
        <w:t>${konuEsc}</w:t>
      </w:r>
    </w:p>

    <!-- İÇERİK PARAGRAFLARI -->
    ${paragraphs}

    <w:p><w:pPr><w:spacing w:before="400" w:after="400"/></w:pPr></w:p>

    <!-- İMZA BLOKU -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
      </w:tblPr>
      <w:tr>
        <w:tc>
          <w:p><w:t></w:t></w:p>
        </w:tc>
        <w:tc>
          <w:p>
            <w:pPr><w:jc w:val="center"/></w:pPr>
            <w:r>
              <w:rPr><w:b/><w:sz w:val="22"/><w:rFonts w:ascii="Segoe UI"/></w:rPr>
              <w:t>${gonderenEsc}</w:t>
            </w:r>
          </w:p>
          <w:p>
            <w:pPr><w:jc w:val="center"/></w:pPr>
            <w:r>
              <w:rPr><w:color w:val="64748B"/><w:sz w:val="20"/><w:rFonts w:ascii="Segoe UI"/></w:rPr>
              <w:t>${unvanEsc}</w:t>
            </w:r>
          </w:p>
          <w:p>
            <w:pPr><w:jc w:val="center"/><w:spacing w:before="200"/></w:pPr>
            <w:r>
              <w:rPr><w:i/><w:color w:val="94A3B8"/><w:sz w:val="18"/><w:rFonts w:ascii="Segoe UI"/></w:rPr>
              <w:t>(Elektronik İmza / Islak İmza)</w:t>
            </w:r>
          </w:p>
        </w:tc>
      </w:tr>
    </w:tbl>
  </w:body>
</w:document>`;

  // 4. Add to ZIP
  zip.file("[Content_Types].xml", contentTypesXml);
  zip.folder("_rels")?.file(".rels", relsXml);
  const wordFolder = zip.folder("word");
  wordFolder?.file("document.xml", documentXml);

  // 5. Generate Blob
  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  return blob;
}
