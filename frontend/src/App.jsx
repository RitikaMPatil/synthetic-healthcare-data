const handleDownload = () => {
  if (!result?.csv_data) {
    setError('No generated CSV available. Please generate data again.')
    return
  }

  const blob = new Blob([result.csv_data], {
    type: 'text/csv;charset=utf-8;'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'synthetic_hospital_data.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}