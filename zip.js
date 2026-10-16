/* ============================================================
   OSPA Compat — zip.js
   Gera um ZIP gravando direto num arquivo do disco, aos poucos.

   Feito para as pendências do comparador (Documentos): arquivos
   grandes (DWG, PDF), muitos de uma vez. Por isso:
     • sem compressão (STORE) — DWG e PDF quase não diminuem, e
       compactar só deixaria tudo mais lento;
     • em fluxo — cada arquivo é lido e gravado em pedaços, nunca
       inteiro na memória;
     • ZIP64 quando passa de 4 GB (um arquivo ou o pacote todo);
     • nomes em UTF-8 (pastas com acento: "Hidrossanitário").

   Sem biblioteca externa: o formato STORE é simples e assim não
   dependemos de código de terceiros.

   Uso:
     const zip = new OspaZip(await handle.createWritable());
     await zip.adicionar('Arquitetura/PDF/planta.pdf', file, bytes => …);
     await zip.adicionarTexto('_pendencias.csv', '…');
     await zip.fechar();
   ============================================================ */

const OSPA_ZIP_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

class OspaZip {
  constructor(destino) {
    this.destino = destino;      // WritableStream de arquivo (FileSystemWritableFileStream)
    this.pos = 0;                // bytes já gravados
    this.itens = [];
  }

  // A partir de quanto vira ZIP64. Fica exposto só para os testes forçarem o caminho.
  static LIMITE = 0xFFFFFFFF;

  async _gravar(bytes) {
    await this.destino.write(bytes);
    this.pos += bytes.length;
  }

  static _crc(crc, bytes) {
    crc = ~crc >>> 0;
    for (let i = 0; i < bytes.length; i++) crc = OSPA_ZIP_CRC[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    return ~crc >>> 0;
  }

  static _dataDos(ms) {
    const d = new Date(ms || Date.now());
    const ano = Math.max(1980, d.getFullYear());
    return {
      hora: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
      dia:  ((ano - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
    };
  }

  // Adiciona um arquivo (File/Blob). aoAvancar(bytesDesteArquivo) é chamado a cada pedaço.
  async adicionar(caminho, arquivo, aoAvancar) {
    const nome = new TextEncoder().encode(caminho.replace(/\\/g, '/'));
    const tamanho = arquivo.size;
    const grande = tamanho >= OspaZip.LIMITE;
    const inicio = this.pos;
    const { hora, dia } = OspaZip._dataDos(arquivo.lastModified);

    // Cabeçalho local. O CRC só é conhecido no fim, então vai num
    // "descritor" depois dos dados (bit 3). Bit 11 = nome em UTF-8.
    const extra = grande ? OspaZip._extra64([0, 0]) : new Uint8Array(0);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true);
    h.setUint16(4, grande ? 45 : 20, true);
    h.setUint16(6, 0x0808, true);
    h.setUint16(8, 0, true);                       // STORE
    h.setUint16(10, hora, true);
    h.setUint16(12, dia, true);
    h.setUint32(14, 0, true);                      // CRC: no descritor
    h.setUint32(18, grande ? 0xFFFFFFFF : 0, true);
    h.setUint32(22, grande ? 0xFFFFFFFF : 0, true);
    h.setUint16(26, nome.length, true);
    h.setUint16(28, extra.length, true);
    await this._gravar(new Uint8Array(h.buffer));
    await this._gravar(nome);
    if (extra.length) await this._gravar(extra);

    let crc = 0, lidos = 0;
    const leitor = arquivo.stream().getReader();
    for (;;) {
      const { done, value } = await leitor.read();
      if (done) break;
      crc = OspaZip._crc(crc, value);
      lidos += value.length;
      await this._gravar(value);
      if (aoAvancar) aoAvancar(lidos);
    }
    if (lidos !== tamanho) throw new Error('O arquivo mudou durante a leitura: ' + caminho);

    // Descritor de dados: CRC e tamanhos (8 bytes cada em ZIP64)
    const dd = new DataView(new ArrayBuffer(grande ? 24 : 16));
    dd.setUint32(0, 0x08074b50, true);
    dd.setUint32(4, crc, true);
    if (grande) {
      dd.setBigUint64(8, BigInt(tamanho), true);
      dd.setBigUint64(16, BigInt(tamanho), true);
    } else {
      dd.setUint32(8, tamanho, true);
      dd.setUint32(12, tamanho, true);
    }
    await this._gravar(new Uint8Array(dd.buffer));

    this.itens.push({ nome, crc, tamanho, inicio, hora, dia, grande });
  }

  async adicionarTexto(caminho, texto) {
    await this.adicionar(caminho, new Blob([texto]));
  }

  // Campo extra ZIP64 (id 0x0001) com os valores de 8 bytes pedidos
  static _extra64(valores) {
    const v = new DataView(new ArrayBuffer(4 + 8 * valores.length));
    v.setUint16(0, 0x0001, true);
    v.setUint16(2, 8 * valores.length, true);
    valores.forEach((x, i) => v.setBigUint64(4 + 8 * i, BigInt(x), true));
    return new Uint8Array(v.buffer);
  }

  async fechar() {
    const inicioDir = this.pos;
    for (const it of this.itens) {
      const desloc64 = it.inicio >= OspaZip.LIMITE;
      const campos = [];
      if (it.grande) campos.push(it.tamanho, it.tamanho);
      if (desloc64) campos.push(it.inicio);
      const extra = campos.length ? OspaZip._extra64(campos) : new Uint8Array(0);
      const precisa64 = it.grande || desloc64;

      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true);
      c.setUint16(4, precisa64 ? 45 : 20, true);   // feito por: MS-DOS, versão
      c.setUint16(6, precisa64 ? 45 : 20, true);
      c.setUint16(8, 0x0808, true);
      c.setUint16(10, 0, true);
      c.setUint16(12, it.hora, true);
      c.setUint16(14, it.dia, true);
      c.setUint32(16, it.crc, true);
      c.setUint32(20, it.grande ? 0xFFFFFFFF : it.tamanho, true);
      c.setUint32(24, it.grande ? 0xFFFFFFFF : it.tamanho, true);
      c.setUint16(28, it.nome.length, true);
      c.setUint16(30, extra.length, true);
      c.setUint16(32, 0, true);                     // comentário
      c.setUint16(34, 0, true);                     // disco
      c.setUint16(36, 0, true);                     // atributos internos
      c.setUint32(38, 0, true);                     // atributos externos
      c.setUint32(42, desloc64 ? 0xFFFFFFFF : it.inicio, true);
      await this._gravar(new Uint8Array(c.buffer));
      await this._gravar(it.nome);
      if (extra.length) await this._gravar(extra);
    }
    const tamDir = this.pos - inicioDir;
    const n = this.itens.length;
    const precisa64 = n >= 0xFFFF || inicioDir >= OspaZip.LIMITE || tamDir >= OspaZip.LIMITE;

    if (precisa64) {
      const inicioFim64 = this.pos;
      const e = new DataView(new ArrayBuffer(56));
      e.setUint32(0, 0x06064b50, true);
      e.setBigUint64(4, 44n, true);
      e.setUint16(12, 45, true);
      e.setUint16(14, 45, true);
      e.setUint32(16, 0, true);
      e.setUint32(20, 0, true);
      e.setBigUint64(24, BigInt(n), true);
      e.setBigUint64(32, BigInt(n), true);
      e.setBigUint64(40, BigInt(tamDir), true);
      e.setBigUint64(48, BigInt(inicioDir), true);
      await this._gravar(new Uint8Array(e.buffer));

      const l = new DataView(new ArrayBuffer(20));
      l.setUint32(0, 0x07064b50, true);
      l.setUint32(4, 0, true);
      l.setBigUint64(8, BigInt(inicioFim64), true);
      l.setUint32(16, 1, true);
      await this._gravar(new Uint8Array(l.buffer));
    }

    const f = new DataView(new ArrayBuffer(22));
    f.setUint32(0, 0x06054b50, true);
    f.setUint16(4, 0, true);
    f.setUint16(6, 0, true);
    f.setUint16(8, precisa64 ? 0xFFFF : n, true);
    f.setUint16(10, precisa64 ? 0xFFFF : n, true);
    f.setUint32(12, precisa64 ? 0xFFFFFFFF : tamDir, true);
    f.setUint32(16, precisa64 ? 0xFFFFFFFF : inicioDir, true);
    f.setUint16(20, 0, true);
    await this._gravar(new Uint8Array(f.buffer));

    await this.destino.close();
  }
}
