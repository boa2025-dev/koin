import useAppStore from '../store/useAppStore'

const useFormatCurrency = () => {
  const userDoc = useAppStore(s => s.userDoc)
  const currency = userDoc?.currency ?? 'ARS'

  const format = (amount) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount ?? 0)

  return format
}

export default useFormatCurrency
