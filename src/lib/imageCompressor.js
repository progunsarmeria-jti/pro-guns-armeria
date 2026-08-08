/**
 * Comprime uma imagem no navegador utilizando a API do Canvas.
 * Se o arquivo não for uma imagem, retorna o arquivo original sem alterações.
 * 
 * @param {File} file O arquivo original.
 * @param {number} maxWidth Dimensão de largura máxima da imagem.
 * @param {number} maxHeight Dimensão de altura máxima da imagem.
 * @param {number} quality Qualidade do JPEG (entre 0 e 1).
 * @returns {Promise<File>} O arquivo comprimido ou o original em caso de erro/outro tipo de arquivo.
 */
export function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.7) {
  return new Promise((resolve) => {
    // Apenas comprime imagens. Se for PDF ou outro formato, passa direto.
    if (!file || !file.type.startsWith('image/')) {
      resolve(file)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Mantém a proporção redimensionando se passar das dimensões máximas
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const originalName = file.name || 'foto.jpg'
              const dotIndex = originalName.lastIndexOf('.')
              const baseName = dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName
              
              // Cria um novo arquivo File a partir do Blob
              const compressedFile = new File([blob], `${baseName}_compressed.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              resolve(file) // fallback
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => resolve(file)
      img.src = e.target.result
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}
