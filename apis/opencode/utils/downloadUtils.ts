// ============================================
// 文件下载工具函数
// 支持从 URL 下载、从 Blob 下载
// ============================================

/**
 * 触发浏览器下载（仅浏览器环境）
 */
export function triggerBrowserDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()

  // 延迟清理，确保下载已启动
  setTimeout(() => {
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }, 100)
}

/**
 * 通用保存：接受原始数据 + 文件名 + MIME 类型
 */
export function saveData(data: Uint8Array, fileName: string, mimeType = 'application/octet-stream'): void {
  const blob = new Blob([data.buffer as ArrayBuffer], { type: mimeType })
  triggerBrowserDownload(blob, fileName)
}

/**
 * 从 URL 异步下载文件并保存
 * 这种方式通过 fetch 获取流，可以解决浏览器直接打开 URL 而不下载的问题
 */
export async function downloadFromUrl(url: string, fileName: string): Promise<void> {
  console.log('Attempting to download from:', url)
  
  try {
    // 尝试使用XMLHttpRequest，有时能更好地处理二进制数据
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', url, true)
      xhr.responseType = 'blob'
      
      xhr.onload = function() {
        console.log('XHR status:', this.status)
        console.log('XHR response type:', this.responseType)
        
        if (this.status === 200) {
          const blob = this.response
          console.log('Blob size:', blob.size)
          console.log('Blob type:', blob.type)
          
          const link = document.createElement('a')
          const objectUrl = URL.createObjectURL(blob)
          link.href = objectUrl
          link.download = fileName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          setTimeout(() => {
            URL.revokeObjectURL(objectUrl)
          }, 100)
          
          console.log('Download completed via XMLHttpRequest')
          resolve()
        } else {
          reject(new Error(`Download failed: ${this.status} ${this.statusText}`))
        }
      }
      
      xhr.onerror = function() {
        console.error('XHR network error')
        reject(new Error('Network error occurred during download'))
      }
      
      xhr.onprogress = function(e) {
        if (e.lengthComputable) {
          console.log(`Download progress: ${e.loaded}/${e.total}`)
        }
      }
      
      console.log('Sending XHR request')
      xhr.send()
    })
  } catch (err) {
    console.error('[DownloadUtils] XMLHttpRequest failed:', err)
    
    try {
      // 如果XMLHttpRequest失败，尝试fetch方法
      console.log('Falling back to fetch method')
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/octet-stream',
          'Content-Type': 'application/octet-stream'
        }
      })
      
      console.log('Fetch response status:', response.status)
      console.log('Fetch response headers:', Object.fromEntries(response.headers.entries()))
      
      const contentType = response.headers.get('Content-Type') || ''
      console.log('Content-Type:', contentType)
      
      if (contentType.includes('text/html')) {
        const responseText = await response.text()
        console.error('Server returned HTML instead of file:', responseText.substring(0, 500) + '...')
        throw new Error('Server returned HTML content. Check server API endpoint.')
      }
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Download failed: ${response.statusText}. Server response: ${errorText.substring(0, 500)}`)
      }

      const blob = await response.blob()
      console.log('Fetch blob size:', blob.size)
      console.log('Fetch blob type:', blob.type)
      
      const link = document.createElement('a')
      const objectUrl = URL.createObjectURL(blob)
      link.href = objectUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl)
      }, 100)
      
      console.log('Download completed via fetch method')
    } catch (fetchErr) {
      console.error('[DownloadUtils] All download methods failed:', fetchErr)
      throw fetchErr
    }
  }
}
